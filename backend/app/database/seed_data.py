"""
Synthetic Seed Data Generator for MoES Extreme Heatwave Platform.
Generates realistic datasets for 7 Major Indian Metropolitan Regions:
- New Delhi NCR (Delhi)
- Mumbai Metropolitan Region (Maharashtra)
- Kolkata Metropolitan Area (West Bengal)
- Bengaluru Urban District (Karnataka)
- Ahmedabad Municipal Region (Gujarat)
- Chennai Metropolitan Area (Tamil Nadu)
- Hyderabad Metropolitan Region (Telangana)

Includes 35 Zones (5 per city), 175 Wards (25 per city with GeoJSON Polygons),
70 Hospitals, 84 Cooling Centers, 5-Day Forecasts, and Historical Health Records.
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
        r_var = 0.8 + 0.4 * random.random()
        pt_lat = center_lat + (lat_degree * math.sin(angle) * r_var)
        pt_lng = center_lng + (lng_degree * math.cos(angle) * r_var)
        coords.append([round(pt_lng, 5), round(pt_lat, 5)])

    coords.append(coords[0])
    return {
        "type": "Polygon",
        "coordinates": [coords]
    }


CITIES_DATA = [
    {
        "name": "New Delhi National Capital Region",
        "state": "Delhi",
        "lat": 28.6139,
        "lng": 77.2090,
        "zones": [
            ("Central Delhi Zone", "ZONE-DEL-CEN", 28.6250, 77.2150),
            ("North Delhi Zone", "ZONE-DEL-NTH", 28.6900, 77.1800),
            ("South Delhi Zone", "ZONE-DEL-STH", 28.5400, 77.2200),
            ("East Delhi Zone", "ZONE-DEL-EST", 28.6300, 77.2900),
            ("West Delhi Zone", "ZONE-DEL-WST", 28.6400, 77.1200),
        ],
        "wards": [
            "Connaught Place", "Karol Bagh", "Chandni Chowk", "Paharganj", "Civil Lines",
            "Rohini Sector 7", "Pitampura", "Model Town", "Shalimar Bagh", "Narendranagar",
            "Hauz Khas", "Saket", "Greater Kailash", "Malviya Nagar", "Vasant Kunj",
            "Laxmi Nagar", "Mayur Vihar Ph-1", "Preet Vihar", "Shahdara", "I.P. Extension",
            "Janakpuri", "Rajouri Garden", "Dwarka Sector 10", "Tilak Nagar", "Paschim Vihar"
        ],
        "hospitals": [
            "AIIMS Apex Disaster Center", "Safdarjung Emergency Ward", "Ram Manohar Lohia Hospital",
            "LNJP Civil Hospital", "Max Super Specialty Saket", "Fortis Escorts Heart & Heat Care",
            "Guru Teg Bahadur Hospital", "Deen Dayal Upadhyay Hospital", "Sir Ganga Ram Emergency Ward",
            "Dr. Baba Saheb Ambedkar Hospital"
        ],
        "cooling_centers": [
            "Connaught Place Municipal Shelter", "Karol Bagh Community Heat Pavilion", "Rohini Air-Conditioned Shelter",
            "Hauz Khas Metro Transit Station", "Laxmi Nagar Respite Hub", "Janakpuri Disaster Relief Pavilion",
            "Pitampura Civic Center Cold Room", "Saket District Sanctuary", "Mayur Vihar Heat Shelter",
            "Dwarka Sector 10 Civic Station", "Civil Lines Emergency Hub", "Preet Vihar Cooling Center"
        ]
    },
    {
        "name": "Mumbai Metropolitan Region",
        "state": "Maharashtra",
        "lat": 19.0760,
        "lng": 72.8777,
        "zones": [
            ("South Mumbai Zone", "ZONE-BOM-STH", 18.9400, 72.8300),
            ("Western Suburbs South", "ZONE-BOM-WS1", 19.0500, 72.8350),
            ("Western Suburbs North", "ZONE-BOM-WS2", 19.1800, 72.8450),
            ("Eastern Suburbs Zone", "ZONE-BOM-EST", 19.0800, 72.9000),
            ("Navi Mumbai Zone", "ZONE-BOM-NVM", 19.0300, 73.0200),
        ],
        "wards": [
            "Colaba", "Marine Lines", "Fort", "Nariman Point", "Malabar Hill",
            "Bandra West", "Juhu", "Andheri East", "Goregaon West", "Borivali East",
            "Dadar", "Dharavi", "Mahim", "Kurla", "Chembur",
            "Ghatkopar East", "Mulund West", "Thane City", "Vashi", "Nerul",
            "Belapur", "Powai", "Santacruz East", "Worli", "Lower Parel"
        ],
        "hospitals": [
            "KEM Hospital Emergency Unit", "Sion Municipal Hospital", "Nair Charitable Hospital",
            "Lilavati Hospital Bandra", "Kokilaben Dhirubhai Ambani Hospital", "Fortis Hospital Mulund",
            "Tata Memorial Disaster Wing", "Hinduja Hospital Mahim", "Bombay Hospital Marine Lines",
            "Apollo Hospital Navi Mumbai"
        ],
        "cooling_centers": [
            "Marine Drive Promenade Shelter", "Bandra Kurla Complex Relief Hub", "Juhu Beach Heat Pavilion",
            "Dharavi Community Cooling Shelter", "Dadar TT Transit Station", "Andheri Metro Cooling Center",
            "Borivali Station Shelter", "Powai Lake Respite Hub", "Ghatkopar Civic Cold Room",
            "Vashi Bus Terminal Shelter", "Nerul Civic Pavilion", "Thane Junction Cooling Hub"
        ]
    },
    {
        "name": "Kolkata Metropolitan Area",
        "state": "West Bengal",
        "lat": 22.5726,
        "lng": 88.3639,
        "zones": [
            ("North Kolkata Zone", "ZONE-CCU-NTH", 22.6100, 88.3700),
            ("Central Kolkata Zone", "ZONE-CCU-CEN", 22.5600, 88.3500),
            ("South Kolkata Zone", "ZONE-CCU-STH", 22.5100, 88.3600),
            ("East Kolkata Tech Zone", "ZONE-CCU-EST", 22.5800, 88.4300),
            ("West Howrah Zone", "ZONE-CCU-HWH", 22.5900, 88.3100),
        ],
        "wards": [
            "Shyambazar", "Bagbazar", "Shobhabazar", "Dum Dum", "Lake Town",
            "Esplanade", "Park Street", "New Market", "Burrabazar", "Bowbazar",
            "Ballygunge", "Alipore", "Gariahat", "Jadavpur", "Tollygunge",
            "Salt Lake Sector 5", "New Town", "Rajarhat", "Kasba", "Ruby Crossing",
            "Howrah Station", "Shibpur", "Santragachi", "Belur", "Bally"
        ],
        "hospitals": [
            "SSKM Medical College Hospital", "Medical College Kolkata Emergency", "RG Kar Medical College",
            "NRS Medical College", "AMRI Hospital Dhakuria", "Apollo Gleneagles Kolkata",
            "Peerless Hospital E.M. Bypass", "Fortis Hospital Anandapur", "Woodlands Medical Center",
            "Howrah General Hospital"
        ],
        "cooling_centers": [
            "Maidan Park Heat Pavilion", "Esplanade Bus Terminus Cooling Shelter", "Howrah Station Transit Cold Room",
            "Salt Lake Sector 5 IT Respite Station", "Shyambazar Five-Point Shelter", "Gariahat Market Relief Hub",
            "Jadavpur University Community Hub", "Park Street Civic Center", "New Town Eco Park Shelter",
            "Dum Dum Junction Cooling Station", "Alipore Zoo Respite Pavilion", "Ruby Crossing Heat Center"
        ]
    },
    {
        "name": "Bengaluru Urban District",
        "state": "Karnataka",
        "lat": 12.9716,
        "lng": 77.5946,
        "zones": [
            ("Central Business Zone", "ZONE-BLR-CEN", 12.9750, 77.5950),
            ("East Tech Zone", "ZONE-BLR-EST", 12.9800, 77.6900),
            ("South Residential Zone", "ZONE-BLR-STH", 12.9100, 77.5800),
            ("North Suburban Zone", "ZONE-BLR-NTH", 13.0600, 77.5900),
            ("West Industrial Zone", "ZONE-BLR-WST", 12.9600, 77.5200),
        ],
        "wards": [
            "MG Road", "Shivajinagar", "Malleshwaram", "Rajajinagar", "Sadashivanagar",
            "Indiranagar", "Domlur", "Whitefield", "Marathahalli", "Bellandur",
            "Jayanagar", "JP Nagar", "Banashankari", "Koramangala", "BTM Layout",
            "Yelahanka", "Hebbal", "RT Nagar", "Manyata Tech Park", "Vidyaranyapura",
            "Peenya", "Yeshwanthpur", "Vijayanagar", "Kengeri", "Basavanagudi"
        ],
        "hospitals": [
            "Victoria Hospital Emergency", "Bowring & Lady Curzon Hospital", "NIMHANS Disaster Trauma Center",
            "Manipal Hospital Old Airport Road", "Apollo Hospital Bannerghatta", "Fortis Hospital Bannerghatta",
            "Columbia Asia Hebbal", "St. John's Medical College", "MS Ramaiah Memorial Hospital",
            "KIMS Hospital KR Road"
        ],
        "cooling_centers": [
            "Cubbon Park Heat Respite Hub", "Lalbagh Botanical Garden Shelter", "Indiranagar Metro Station Center",
            "Whitefield ITPL Transit Shelter", "Koramangala Bus Station Cooling Room", "Yelahanka Civic Pavilion",
            "Peenya Industrial Area Workers Hub", "Jayanagar 4th Block Shelter", "Yeshwanthpur Terminal Station",
            "Hebbal Flyover Respite Center", "Malleshwaram Grounds Cooling Station", "Electronic City IT Hub"
        ]
    },
    {
        "name": "Ahmedabad Municipal Region",
        "state": "Gujarat",
        "lat": 23.0225,
        "lng": 72.5714,
        "zones": [
            ("West Zone", "ZONE-AMD-WST", 23.0300, 72.5300),
            ("Central Walled City Zone", "ZONE-AMD-CEN", 23.0200, 72.5800),
            ("North Zone", "ZONE-AMD-NTH", 23.0800, 72.5900),
            ("South Zone", "ZONE-AMD-STH", 22.9700, 72.5800),
            ("East Industrial Zone", "ZONE-AMD-EST", 23.0100, 72.6400),
        ],
        "wards": [
            "Navrangpura", "Satellite", "Bodakdev", "SG Highway", "Vastrapur",
            "Ashram Road", "Relief Road", "Maninagar", "Kankaria", "Kalupur",
            "Shahibaug", "Chandkheda", "Ranip", "Ghatlodia", "Paldi",
            "Ellis Bridge", "Vasna", "Juhapura", "Sarkhej", "Naroda",
            "Odhav", "Nikol", "Bapu Nagar", "Amraiwadi", "Sabarmati"
        ],
        "hospitals": [
            "Ahmedabad Civil Hospital Trauma Center", "SVP Institute of Medical Sciences", "VS General Hospital",
            "Apollo Hospital Bhat", "Zydus Hospital Thaltej", "CIMS Hospital Science City",
            "Shardaben General Hospital Saraspur", "LG General Hospital Maninagar", "SAL Hospital Drive-In",
            "Sterling Hospital Gurukul"
        ],
        "cooling_centers": [
            "Sabarmati Riverfront Heat Pavilion", "Kankaria Lakefront Cooling Hub", "Kalupur Railway Station Shelter",
            "SG Highway Worker Respite Center", "Maninagar Civic Cold Room", "Navrangpura Bus Rapid Transit Shelter",
            "Naroda Industrial Area Shade Hub", "Chandkheda Civic Pavilion", "Paldi Cross Road Cooling Station",
            "Bapu Nagar Worker Respite Hub", "Satellite Garden Relief Shelter", "Shahibaug Transit Pavilion"
        ]
    },
    {
        "name": "Chennai Metropolitan Area",
        "state": "Tamil Nadu",
        "lat": 13.0827,
        "lng": 80.2707,
        "zones": [
            ("North Chennai Zone", "ZONE-MAA-NTH", 13.1200, 80.2800),
            ("Central Chennai Zone", "ZONE-MAA-CEN", 13.0800, 80.2600),
            ("South Coastal Zone", "ZONE-MAA-STH", 13.0000, 80.2500),
            ("West Industrial Zone", "ZONE-MAA-WST", 13.0800, 80.1800),
            ("IT Corridor Zone", "ZONE-MAA-ITC", 12.9300, 80.2200),
        ],
        "wards": [
            "Royapuram", "Tondiarpet", "Washermanpet", "Perambur", "Vyasarpadi",
            "George Town", "Egmore", "Nungambakkam", "Thousand Lights", "Anna Nagar",
            "T. Nagar", "Mylapore", "Adyar", "Besant Nagar", "Alwarpet",
            "Guindy", "Velachery", "OMR IT Expressway", "Sholinganallur", "Thoraipakkam",
            "Kodambakkam", "Vadapalani", "Koyambedu", "Porur", "Chromepet"
        ],
        "hospitals": [
            "Rajiv Gandhi Government General Hospital", "Government Stanley Medical College", "Kilpauk Medical College",
            "Apollo Hospital Greams Road", "MIOT International Hospital", "Sri Ramachandra Medical Center",
            "Fortis Malar Hospital Adyar", "Kauvery Hospital Alwarpet", "SIMS Hospital Vadapalani",
            "Government Peripheral Hospital Anna Nagar"
        ],
        "cooling_centers": [
            "Marina Beach Breeze Pavilion", "Central Railway Station Cooling Hub", "Koyambedu Bus Terminus Shelter",
            "T. Nagar Panagal Park Respite Center", "Adyar Signal Civic Shelter", "Anna Nagar Tower Park Pavilion",
            "OMR Sholinganallur IT Shelter", "Guindy Industrial Estate Worker Hub", "Besant Nagar Elliot's Beach Center",
            "Velachery Railway Station Shelter", "Egmore Transit Cooling Room", "Royapuram Harbor Worker Pavilion"
        ]
    },
    {
        "name": "Hyderabad Metropolitan Region",
        "state": "Telangana",
        "lat": 17.3850,
        "lng": 78.4867,
        "zones": [
            ("Core City Zone", "ZONE-HYD-CEN", 17.3900, 78.4700),
            ("Secunderabad Zone", "ZONE-HYD-SEC", 17.4400, 78.5000),
            ("Cyberabad IT Zone", "ZONE-HYD-CYB", 17.4400, 78.3800),
            ("South Old City Zone", "ZONE-HYD-STH", 17.3500, 78.4700),
            ("East LB Nagar Zone", "ZONE-HYD-EST", 17.3700, 78.5500),
        ],
        "wards": [
            "Abids", "Koti", "Himayatnagar", "Basheerbagh", "Nampally",
            "Secunderabad Station", "Begumpet", "Tarnaka", "Malkajgiri", "Marredpally",
            "HITECH City", "Gachibowli", "Madhapur", "Kondapur", "Jubilee Hills",
            "Charminar", "Bahadurpura", "Falaknuma", "Santoshnagar", "Chandrayangutta",
            "LB Nagar", "Dilsukhnagar", "Uppal", "Ramanthapur", "Malakpet"
        ],
        "hospitals": [
            "Osmania General Hospital", "Gandhi Hospital Secunderabad", "Nizam's Institute of Medical Sciences",
            "Yashoda Hospital Somajiguda", "Apollo Hospital Jubilee Hills", "Continental Hospital Gachibowli",
            "KIMS Hospital Secunderabad", "CARE Hospital Banjara Hills", "Sunshine Hospital Gachibowli",
            "Kamineni Hospital LB Nagar"
        ],
        "cooling_centers": [
            "Charminar Heritage Cooling Pavilion", "HITECH City Cyber Towers Shelter", "Secunderabad Junction Cold Room",
            "Nampally Station Respite Center", "Hussain Sagar Lakefront Shelter", "Gachibowli Stadium Heat Hub",
            "LB Nagar Ring Road Pavilion", "Jubilee Hills Checkpost Shelter", "Begumpet Airport Transit Center",
            "Tarnaka Crossroads Cooling Room", "Dilsukhnagar Civic Shelter", "Koti Bus Station Respite Pavilion"
        ]
    }
]


def seed_database(db: Session):
    # Check if already seeded with all 7 locations
    if db.query(Location).count() >= len(CITIES_DATA):
        print("Database already fully seeded with 7 cities.")
        return

    print("Clearing and re-seeding database with 7 Major Indian Metropolitan datasets...")
    # Clear existing tables for fresh multi-city seed
    db.query(ActionItem).delete()
    db.query(NotificationLog).delete()
    db.query(Alert).delete()
    db.query(HealthRecord).delete()
    db.query(CoolingCenter).delete()
    db.query(Hospital).delete()
    db.query(RiskAssessment).delete()
    db.query(WeatherForecast).delete()
    db.query(WeatherObservation).delete()
    db.query(PopulationVulnerability).delete()
    db.query(Ward).delete()
    db.query(Zone).delete()
    db.query(Location).delete()
    db.commit()

    today_dt = datetime.utcnow()
    forecast_dates = [(today_dt + timedelta(days=d)).strftime("%Y-%m-%d") for d in range(5)]
    horizons = [24, 48, 72, 96, 120]

    for city_idx, c_data in enumerate(CITIES_DATA):
        print(f"Seeding City {city_idx+1}/{len(CITIES_DATA)}: {c_data['name']}...")
        loc = Location(
            name=c_data["name"],
            state=c_data["state"],
            country="India",
            lat=c_data["lat"],
            lng=c_data["lng"]
        )
        db.add(loc)
        db.commit()
        db.refresh(loc)

        # Zones
        created_zones = []
        for z_name, z_code, z_lat, z_lng in c_data["zones"]:
            z = Zone(location_id=loc.id, name=z_name, code=z_code)
            db.add(z)
            created_zones.append((z, z_lat, z_lng))
        db.commit()

        # Wards
        ward_counter = 1
        created_wards = []
        ward_names = c_data["wards"]

        for zone, z_lat, z_lng in created_zones:
            db.refresh(zone)
            for i in range(5):
                w_name = ward_names[ward_counter - 1]
                w_lat = z_lat + random.uniform(-0.030, 0.030)
                w_lng = z_lng + random.uniform(-0.030, 0.030)
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

                tot_pop = random.randint(15000, 48000)
                eld_pop = int(tot_pop * random.uniform(0.12, 0.28))
                child_pop = int(tot_pop * random.uniform(0.08, 0.15))
                outdoor_workers = int(tot_pop * random.uniform(0.15, 0.35))
                pop_density = random.uniform(8000, 26000)
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

        # Weather Observations & 5-Day Forecasts
        for idx, w in enumerate(created_wards):
            # Regional temperature baseline
            region_temp_offset = (city_idx % 3) * 1.5
            base_temp = 34.0 + region_temp_offset + (idx % 5) * 2.0 + random.uniform(-0.8, 1.2)
            base_hum = 45.0 + random.uniform(10.0, 35.0)
            wind = random.uniform(3.0, 14.0)
            solar = random.uniform(500.0, 920.0)

            hi_val, _ = calculate_heat_index(base_temp, base_hum)
            wbgt_val, _, _ = calculate_wbgt(base_temp, base_hum, wind, solar)
            utci_val, _, _ = calculate_utci(base_temp, base_hum, wind, solar)
            htsi_score, risk_lvl, _ = calculate_htsi(base_temp, base_hum, wind, solar, wbgt_val, utci_val)

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

        # Hospitals (10 per city)
        h_list = c_data["hospitals"]
        for idx, h_name in enumerate(h_list):
            target_ward = created_wards[idx * 2 % len(created_wards)]
            beds = random.randint(180, 450)
            icu = int(beds * random.uniform(0.12, 0.22))
            heat_adm = random.randint(5, 25)
            h = Hospital(
                ward_id=target_ward.id,
                name=h_name,
                address=f"Main Road, {target_ward.name}, {loc.name}",
                contact_phone=f"+91 98200 {10000+idx+city_idx*100}",
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

        # Cooling Centers (12 per city)
        c_list = c_data["cooling_centers"]
        for idx, c_name in enumerate(c_list):
            target_ward = created_wards[(idx * 2 + 1) % len(created_wards)]
            cap = random.randint(150, 400)
            occ = int(cap * random.uniform(0.4, 0.85))
            c = CoolingCenter(
                ward_id=target_ward.id,
                name=c_name,
                address=f"Plot {idx+10}, {target_ward.name}, {loc.name}",
                capacity=cap,
                current_occupancy=occ,
                opening_hours="08:00 AM - 08:00 PM",
                is_active=True,
                facilities="Chilled Water, Air Conditioning, Misting Fans, ORS Packets, First Aid",
                contact_person=f"Coordinator {chr(65+idx)}. Sharma",
                contact_phone=f"+91 98100 {12300+idx+city_idx*100}",
                lat=target_ward.lat + random.uniform(-0.004, 0.004),
                lng=target_ward.lng + random.uniform(-0.004, 0.004)
            )
            db.add(c)
        db.commit()

        # Historical Health Records (30 days)
        for past_day in range(30, 0, -1):
            dt_str = (today_dt - timedelta(days=past_day)).strftime("%Y-%m-%d")
            for w in created_wards[:8]:
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

        # Alerts & Action Items
        high_risk_assessments = db.query(RiskAssessment).join(Ward).filter(
            Ward.zone_id.in_([z.id for z, _, _ in created_zones]),
            RiskAssessment.risk_level.in_(["EXTREME", "VERY HIGH", "HIGH"])
        ).all()

        for ra in high_risk_assessments[:3]:
            target_w = db.query(Ward).get(ra.ward_id)
            v_data = db.query(PopulationVulnerability).filter_by(ward_id=target_w.id).first()

            alert = Alert(
                ward_id=target_w.id,
                risk_level=ra.risk_level,
                title=f"MoES Heat Alert: {ra.risk_level} Thermal Stress in {target_w.name}",
                message=f"HTSI score reached {ra.htsi_score}/100. WBGT exceeds safety thresholds. High risk for outdoor laborers and vulnerable citizens in {loc.name}.",
                expected_start="12:00 PM Today",
                expected_duration_hours=6,
                affected_population=v_data.total_population if v_data else 25000,
                status="ACTIVE"
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)

            actions = [
                ("OPEN_COOLING_CENTER", f"Activate all community cooling centers in {target_w.name}."),
                ("SHIFT_WORK", "Issue mandatory directive to suspend outdoor labor between 12:00 PM and 04:00 PM."),
                ("ALERT_HOSPITAL", f"Place emergency heat wards in {loc.name} on High Readiness."),
                ("PUBLIC_WARNING", "Broadcast SMS & WhatsApp Red Alerts to registered residents.")
            ]

            for a_type, a_desc in actions:
                ai = ActionItem(
                    alert_id=alert.id,
                    ward_id=target_w.id,
                    action_type=a_type,
                    description=a_desc,
                    assigned_to=f"Disaster Management Team - {loc.name}",
                    status=random.choice(["PENDING", "IN_PROGRESS", "COMPLETED"]),
                    notes="Initiated per NCMRWF SOP Protocol 2026."
                )
                db.add(ai)

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

    print(f"Multi-city database seeding completed successfully for {len(CITIES_DATA)} cities!")
