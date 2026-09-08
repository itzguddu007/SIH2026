"""
Synthetic Seed Data Generator for MoES Extreme Heatwave Platform Demo Mode.
Generates realistic data for New Delhi Region (1 City, 5 Zones, 25 Wards with GeoJSON Polygons,
10 Hospitals, 12 Cooling Centers, 5-Day Forecasts, and Historical Health Records).
"""

import math
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database.models import (
    Location, Zone, Ward, PopulationVulnerability, WeatherObservation,
    WeatherForecast, HealthRecord, Hospital, CoolingCenter, RiskAssessment,
    Alert, NotificationLog, ActionItem
)
from app.algorithms.thermal import calculate_heat_index, calculate_wbgt, calculate_utci, calculate_htsi
from app.algorithms.mortality_model import ml_manager


def generate_geojson_polygon(center_lat: float, center_lng: float, radius_km: float = 1.5) -> dict:
    """Generate a realistic 6-point polygon for GIS ward boundary visualization."""
    coords = []
    num_points = 6
    lat_degree = radius_km / 111.0
    lng_degree = radius_km / (111.0 * math.cos(math.radians(center_lat)))

    for i in range(num_points):
        angle = (2 * math.pi / num_points) * i
        # Add random variation to polygon shape
        r_var = 0.8 + 0.4 * random.random()
        pt_lat = center_lat + (lat_degree * math.sin(angle) * r_var)
        pt_lng = center_lng + (lng_degree * math.cos(angle) * r_var)
        coords.append([round(pt_lng, 5), round(pt_lat, 5)])

    # Close polygon
    coords.append(coords[0])

    return {
        "type": "Polygon",
        "coordinates": [coords]
    }


def seed_database(db: Session):
    # Check if already seeded
    if db.query(Location).first():
        return

    print("Seeding database with realistic MoES NCMRWF demo data...")

    # 1. Create Location
    loc = Location(
        name="New Delhi National Capital Region",
        state="Delhi",
        country="India",
        lat=28.6139,
        lng=77.2090
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)

    # 2. Create 5 Zones
    zone_names = [
        ("Central Delhi Zone", "ZONE-CEN", 28.6250, 77.2150),
        ("North Delhi Zone", "ZONE-NTH", 28.6900, 77.1800),
        ("South Delhi Zone", "ZONE-STH", 28.5400, 77.2200),
        ("East Delhi Zone", "ZONE-EST", 28.6300, 77.2900),
        ("West Delhi Zone", "ZONE-WST", 28.6400, 77.1200),
    ]

    created_zones = []
    for name, code, lat, lng in zone_names:
        z = Zone(location_id=loc.id, name=name, code=code)
        db.add(z)
        created_zones.append((z, lat, lng))
    db.commit()

    # 3. Create 25 Wards (5 per Zone)
    ward_counter = 1
    created_wards = []

    ward_names_pool = [
        "Connaught Place", "Karol Bagh", "Chandni Chowk", "Paharganj", "Civil Lines",
        "Rohini Sector 7", "Pitampura", "Model Town", "Shalimar Bagh", "Narendranagar",
        "Hauz Khas", "Saket", "Greater Kailash", "Malviya Nagar", "Vasant Kunj",
        "Laxmi Nagar", "Mayur Vihar Ph-1", "Preet Vihar", "Shahdara", "I.P. Extension",
        "Janakpuri", "Rajouri Garden", "Dwarka Sector 10", "Tilak Nagar", "Paschim Vihar"
    ]

    for zone, z_lat, z_lng in created_zones:
        db.refresh(zone)
        for i in range(5):
            w_name = ward_names_pool[ward_counter - 1]
            w_lat = z_lat + random.uniform(-0.035, 0.035)
            w_lng = z_lng + random.uniform(-0.035, 0.035)
            poly = generate_geojson_polygon(w_lat, w_lng, radius_km=random.uniform(1.2, 2.2))

            w = Ward(
                zone_id=zone.id,
                ward_number=ward_counter,
                name=f"Ward {ward_counter}: {w_name}",
                lat=round(w_lat, 5),
                lng=round(w_lng, 5),
                geojson_polygon=poly
            )
            db.add(w)
            db.commit()
            db.refresh(w)
            created_wards.append(w)

            # 4. Population & Vulnerability Data
            tot_pop = random.randint(15000, 45000)
            eld_pop = int(tot_pop * random.uniform(0.12, 0.28))
            child_pop = int(tot_pop * random.uniform(0.08, 0.15))
            outdoor_workers = int(tot_pop * random.uniform(0.15, 0.35))
            pop_density = random.uniform(8000, 24000)
            vuln_score = round(random.uniform(40.0, 92.0), 1)

            vuln = PopulationVulnerability(
                ward_id=w.id,
                total_population=tot_pop,
                elderly_population=eld_pop,
                children_population=child_pop,
                outdoor_workers=outdoor_workers,
                population_density=round(pop_density, 1),
                vulnerability_score=vuln_score
            )
            db.add(vuln)
            ward_counter += 1

    db.commit()

    # 5. Seed Weather Observations & 5-Day Forecasts for each Ward
    today_dt = datetime.utcnow()
    forecast_dates = [(today_dt + timedelta(days=d)).strftime("%Y-%m-%d") for d in range(5)]
    horizons = [24, 48, 72, 96, 120]

    for idx, w in enumerate(created_wards):
        # Base thermal severity varies by ward to create realistic map gradient
        # Some wards hit 43-45°C (EXTREME), some 39-41°C (VERY HIGH/HIGH), some 35-37°C (MODERATE)
        base_temp = 36.0 + (idx % 5) * 2.2 + random.uniform(-0.8, 1.2)
        base_hum = 45.0 + random.uniform(10.0, 30.0)
        wind = random.uniform(3.0, 14.0)
        solar = random.uniform(500.0, 920.0)

        hi_val, _ = calculate_heat_index(base_temp, base_hum)
        wbgt_val, _, _ = calculate_wbgt(base_temp, base_hum, wind, solar)
        utci_val, _, _ = calculate_utci(base_temp, base_hum, wind, solar)
        htsi_score, risk_lvl, sub = calculate_htsi(base_temp, base_hum, wind, solar, wbgt_val, utci_val)

        # Current observation
        obs = WeatherObservation(
            ward_id=w.id,
            timestamp=today_dt,
            temp_celsius=round(base_temp, 1),
            relative_humidity=round(base_hum, 1),
            wind_speed_kmh=round(wind, 1),
            solar_radiation_wm2=round(solar, 1),
            heat_index=hi_val,
            wbgt=wbgt_val,
            utci=utci_val
        )
        db.add(obs)

        # 5-Day Forecasts
        for day_idx in range(5):
            f_temp = base_temp + random.uniform(-1.5, 3.0) + (1.0 if day_idx in [2, 3] else 0.0)
            f_hum = max(20.0, min(90.0, base_hum + random.uniform(-10.0, 15.0)))
            f_wind = max(2.0, wind + random.uniform(-2.0, 4.0))
            f_solar = max(400.0, solar + random.uniform(-100.0, 100.0))

            f_hi, _ = calculate_heat_index(f_temp, f_hum)
            f_wbgt, _, _ = calculate_wbgt(f_temp, f_hum, f_wind, f_solar)
            f_utci, _, _ = calculate_utci(f_temp, f_hum, f_wind, f_solar)
            f_htsi, f_risk, _ = calculate_htsi(f_temp, f_hum, f_wind, f_solar, f_wbgt, f_utci)

            wf = WeatherForecast(
                ward_id=w.id,
                forecast_date=forecast_dates[day_idx],
                horizon_hours=horizons[day_idx],
                temp_celsius=round(f_temp, 1),
                relative_humidity=round(f_hum, 1),
                wind_speed_kmh=round(f_wind, 1),
                solar_radiation_wm2=round(f_solar, 1),
                heat_index=f_hi,
                wbgt=f_wbgt,
                utci=f_utci,
                predicted_risk_level=f_risk
            )
            db.add(wf)

        # Risk Assessment for current state
        v_data = db.query(PopulationVulnerability).filter_by(ward_id=w.id).first()
        vuln_ratio = (v_data.elderly_population + v_data.children_population) / max(1, v_data.total_population)
        outdoor_ratio = v_data.outdoor_workers / max(1, v_data.total_population)
        heat_duration = random.choice([1, 2, 3, 4])

        feat = {
            "temp_celsius": base_temp,
            "humidity": base_hum,
            "wbgt": wbgt_val,
            "utci": utci_val,
            "htsi": htsi_score,
            "heat_duration_days": heat_duration,
            "night_min_temp": base_temp - random.uniform(8.0, 12.0),
            "pop_density": v_data.population_density,
            "vulnerable_ratio": vuln_ratio,
            "outdoor_worker_ratio": outdoor_ratio
        }

        m_risk, h_risk, conf_str, conf_val = ml_manager.predict(feat)
        reasons = ml_manager.explain(feat, ward_name=w.name)

        ra = RiskAssessment(
            ward_id=w.id,
            timestamp=today_dt,
            horizon_hours=24,
            htsi_score=htsi_score,
            risk_level=risk_lvl,
            mortality_risk=m_risk,
            hospitalization_risk=h_risk,
            confidence=conf_val,
            explainability_json=reasons
        )
        db.add(ra)

    db.commit()

    # 6. Seed Hospitals (10 hospitals spread across wards)
    hospital_names = [
        ("AIIMS Apex Disaster Center", 450, 80, 18),
        ("Safdarjung Hospital Emergency", 350, 50, 14),
        ("Ram Manohar Lohia Hospital", 300, 40, 11),
        ("LNJP Civil Hospital", 280, 35, 15),
        ("Max Super Specialty Saket", 200, 30, 8),
        ("Fortis Escorts Heart & Heat Care", 180, 25, 6),
        ("Guru Teg Bahadur Hospital", 320, 45, 12),
        ("Deen Dayal Upadhyay Hospital", 250, 30, 9),
        ("Sir Ganga Ram Emergency Ward", 220, 28, 7),
        ("Dr. Baba Saheb Ambedkar Hospital", 260, 32, 10)
    ]

    for idx, (h_name, beds, icu, heat_adm) in enumerate(hospital_names):
        target_ward = created_wards[idx * 2 % len(created_wards)]
        h = Hospital(
            ward_id=target_ward.id,
            name=h_name,
            address=f"Sector {idx+1}, Near Ring Road, {target_ward.name}",
            contact_phone=f"+91 11 2658 {8000+idx}",
            total_beds=beds,
            available_beds=int(beds * random.uniform(0.15, 0.45)),
            icu_beds_total=icu,
            icu_beds_available=int(icu * random.uniform(0.10, 0.35)),
            heat_admissions_today=heat_adm,
            preparedness_status=random.choice(["READY", "ELEVATED", "CRITICAL"]),
            lat=target_ward.lat + random.uniform(-0.005, 0.005),
            lng=target_ward.lng + random.uniform(-0.005, 0.005)
        )
        db.add(h)
    db.commit()

    # 7. Seed Cooling Centers (12 centers)
    cooling_names = [
        "Connaught Place Municipal Cooling Shelter",
        "Karol Bagh Community Heat Relief Pavilion",
        "Rohini Community Air-Conditioned Shelter",
        "Hauz Khas Metro Transit Cooling Station",
        "Laxmi Nagar Public Heat Respite Hub",
        "Janakpuri Disaster Relief Pavilion",
        "Pitampura Civic Center Cold Room",
        "Saket District Cooling Sanctuary",
        "Mayur Vihar Phase-1 Heat Shelter",
        "Dwarka Sector 10 Civic Cooling Station",
        "Civil Lines Emergency Shade & Water Hub",
        "Preet Vihar Community Cooling Center"
    ]

    for idx, c_name in enumerate(cooling_names):
        target_ward = created_wards[(idx * 2 + 1) % len(created_wards)]
        cap = random.randint(150, 400)
        occ = int(cap * random.uniform(0.4, 0.85))
        c = CoolingCenter(
            ward_id=target_ward.id,
            name=c_name,
            address=f"Plot {idx+101}, Main Road, {target_ward.name}",
            capacity=cap,
            current_occupancy=occ,
            opening_hours="08:00 AM - 08:00 PM",
            is_active=True,
            facilities="Chilled Water, Air Conditioning, Misting Fans, ORS Packets, First Aid",
            contact_person=f"Officer {chr(65+idx)}. K. Sharma",
            contact_phone=f"+91 98100 {12300+idx}",
            lat=target_ward.lat + random.uniform(-0.004, 0.004),
            lng=target_ward.lng + random.uniform(-0.004, 0.004)
        )
        db.add(c)
    db.commit()

    # 8. Seed Historical Health Records (30 days of data for correlation analytics)
    for past_day in range(30, 0, -1):
        dt_str = (today_dt - timedelta(days=past_day)).strftime("%Y-%m-%d")
        for w in created_wards[:10]:  # Sample top 10 wards
            h_temp = 32.0 + random.uniform(0.0, 14.0)
            h_htsi = min(100.0, (h_temp - 25.0) * 4.5 + random.uniform(-5.0, 5.0))
            hosp_count = max(0, int((h_htsi - 35.0) * 0.4 + random.normalvariate(2.0, 1.5)))
            stroke_count = max(0, int((h_htsi - 45.0) * 0.25 + random.normalvariate(1.0, 0.8)))
            mort_count = max(0, int((h_htsi - 55.0) * 0.15 + random.normalvariate(0.3, 0.5)))

            rec = HealthRecord(
                ward_id=w.id,
                record_date=dt_str,
                hospitalizations=hosp_count,
                heat_stroke_cases=stroke_count,
                mortality_count=mort_count,
                avg_temp=round(h_temp, 1),
                max_htsi=round(h_htsi, 1)
            )
            db.add(rec)
    db.commit()

    # 9. Seed Active Alerts & Action Items
    high_risk_assessments = db.query(RiskAssessment).filter(RiskAssessment.risk_level.in_(["EXTREME", "VERY HIGH"])).all()

    for ra in high_risk_assessments[:5]:
        target_w = db.query(Ward).get(ra.ward_id)
        v_data = db.query(PopulationVulnerability).filter_by(ward_id=target_w.id).first()

        alert = Alert(
            ward_id=target_w.id,
            risk_level=ra.risk_level,
            title=f"MoES Red Alert: {ra.risk_level} Thermal Stress in {target_w.name}",
            message=f"Human Thermal Stress Index has reached {ra.htsi_score}/100. WBGT exceeds safety thresholds. High risk for outdoor laborers and elderly citizens.",
            expected_start="12:00 PM Today",
            expected_duration_hours=6,
            affected_population=v_data.total_population if v_data else 25000,
            status="ACTIVE"
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        # Action Items for Municipal Action Center
        actions = [
            ("OPEN_COOLING_CENTER", "Activate all community cooling centers and distribute ORS packets."),
            ("SHIFT_WORK", "Issue mandatory directive to suspend outdoor labor between 12:00 PM and 04:00 PM."),
            ("ALERT_HOSPITAL", "Place AIIMS & Safdarjung Emergency Heat Wards on High Readiness."),
            ("PUBLIC_WARNING", "Broadcast SMS & WhatsApp Red Alerts to registered residents in ward.")
        ]

        for a_type, a_desc in actions:
            ai = ActionItem(
                alert_id=alert.id,
                ward_id=target_w.id,
                action_type=a_type,
                description=a_desc,
                assigned_to="Disaster Management Response Team Alpha",
                status=random.choice(["PENDING", "IN_PROGRESS", "COMPLETED"]),
                notes="Initiated per NCMRWF SOP Protocol 2026."
            )
            db.add(ai)

        # Notification log mock
        nl = NotificationLog(
            alert_id=alert.id,
            channel="SMS",
            recipient="+919876543210",
            message_text=alert.message,
            status="DELIVERED",
            provider="MoES Mock SMS Gateway"
        )
        db.add(nl)

    db.commit()
    print("Database seeding completed successfully!")
