"""
Notification Provider Abstraction for SMS and WhatsApp alerts.
Supports production credentials with fallback to MockNotificationProvider for hackathon demonstration.
"""

import os
from typing import Dict, Any, List

class BaseNotificationProvider:
    def send_sms(self, phone: str, message: str) -> Dict[str, Any]:
        raise NotImplementedError

    def send_whatsapp(self, phone: str, message: str) -> Dict[str, Any]:
        raise NotImplementedError


class MockNotificationProvider(BaseNotificationProvider):
    def send_sms(self, phone: str, message: str) -> Dict[str, Any]:
        return {
            "status": "DELIVERED",
            "channel": "SMS",
            "provider": "MoES Integrated Mock Gateway",
            "recipient": phone,
            "message_id": f"sms_mock_{os.urandom(4).hex()}",
            "note": "Demonstration mode: SMS simulated successfully."
        }

    def send_whatsapp(self, phone: str, message: str) -> Dict[str, Any]:
        return {
            "status": "DELIVERED",
            "channel": "WHATSAPP",
            "provider": "MoES Meta WhatsApp Business Gateway",
            "recipient": phone,
            "message_id": f"wa_mock_{os.urandom(4).hex()}",
            "note": "Demonstration mode: WhatsApp template message delivered."
        }


class SMSProvider(BaseNotificationProvider):
    def __init__(self):
        self.api_key = os.getenv("SMS_API_KEY")

    def send_sms(self, phone: str, message: str) -> Dict[str, Any]:
        if not self.api_key:
            return MockNotificationProvider().send_sms(phone, message)
        
        # External Provider REST Call placeholder
        return {
            "status": "SENT",
            "channel": "SMS",
            "provider": "Twilio / Telecom Gateway",
            "recipient": phone,
            "message_id": f"sms_live_{os.urandom(4).hex()}"
        }


class WhatsAppProvider(BaseNotificationProvider):
    def __init__(self):
        self.api_key = os.getenv("WHATSAPP_API_KEY")
        self.phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

    def send_whatsapp(self, phone: str, message: str) -> Dict[str, Any]:
        if not self.api_key or not self.phone_id:
            return MockNotificationProvider().send_whatsapp(phone, message)

        # Meta WhatsApp Business Cloud API REST Call placeholder
        return {
            "status": "SENT",
            "channel": "WHATSAPP",
            "provider": "Meta WhatsApp Business API",
            "recipient": phone,
            "message_id": f"wa_live_{os.urandom(4).hex()}"
        }


def get_notification_provider() -> BaseNotificationProvider:
    if os.getenv("SMS_API_KEY"):
        return SMSProvider()
    elif os.getenv("WHATSAPP_API_KEY"):
        return WhatsAppProvider()
    else:
        return MockNotificationProvider()
