const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// Twilio client (initialized safely so server can start even before env vars are set)
let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
}

// Health check route
app.get("/api/health", (req, res) => {
    res.json({
        status: "online",
        message: "SIH2026 Heatwave Alert Backend is running",
        twilioConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    });
});

// Send alert
app.post("/api/send-alert", async (req, res) => {

    try {
        if (!client) {
            if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
                client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Twilio credentials are not configured in environment variables"
                });
            }
        }

        const {
            city,
            risk,
            wbgt,
            excessMortality,
            leadTime
        } = req.body;

        if (!city || !risk || wbgt === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing alert information"
            });
        }

        const messageText =
`🚨 EXTREME HEATWAVE EARLY WARNING

Location: ${city}
Risk Level: ${risk}
WBGT: ${wbgt}°C
Estimated Excess Mortality: +${excessMortality}%
Lead Time: ${leadTime}

Please take necessary precautions.

SIH 26083 — Human Thermal Stress Index`;

        const message = await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_FROM,
            to: process.env.ALERT_TO_NUMBER,
            body: messageText
        });

        console.log("Message sent:", message.sid);

        res.json({
            success: true,
            message: "Alert dispatched successfully",
            sid: message.sid
        });

    } catch (error) {

        console.error("Twilio error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to dispatch alert",
            error: error.message
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`SIH2026 backend running on port ${PORT}`);
});
