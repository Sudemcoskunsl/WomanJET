import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import stripe
import re

app = FastAPI(title="WomanJET VIP Transfer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_51Mz...")

class ChatRequest(BaseModel):
    message: str

class PaymentRequest(BaseModel):
    car_name: str
    amount_eur: float

CARS_DATABASE = [
    {
        "id": 1,
        "name": "Mercedes-Benz Vito Premium",
        "capacity": 6,
        "price_eur": 80,
        "features": ["Free Wi-Fi", "Mini Bar", "Apple TV", "Bebek Koltuğu"]
    },
    {
        "id": 2,
        "name": "Mercedes-Benz Sprinter Ultra VIP",
        "capacity": 13,
        "price_eur": 330,
        "features": ["PlayStation 5", "Reclining Seats", "Free Wi-Fi", "Sound System"]
    },
    {
        "id": 3,
        "name": "Mercedes-Maybach S-Class VIP",
        "capacity": 3,
        "price_eur": 200,
        "features": ["Massage Seats", "Free Wi-Fi", "Bebek Koltuğu"]
    },
    {
        "id": 4,
        "name": "Mercedes-Benz Sprinter Ultra VIP",
        "capacity": 6,
        "price_eur": 130,
        "features": ["Massage Seats", "Sound System", "Free Wi-Fi", "Mini Bar"]
    },
    {
        "id": 5,
        "name": "Mercedes-Benz Vito Premium",
        "capacity": 8,
        "price_eur": 160,
        "features": ["Massage Seats", "Free Wi-Fi", "Apple TV"]
    },
    {
        "id": 6,
        "name": "Mercedes-Maybach S-Class VIP",
        "capacity": 2,
        "price_eur": 80,
        "features": ["PlayStation 5", "Free Wi-Fi"]
    }
]

def calculate_flight_and_recommend(message: str):
    msg_lower = message.lower()
    
    # Şehirler
    cities = ["istanbul", "ankara", "konya", "antalya", "izmir", "bursa"]
    
    transfer_keywords = ["araç", "transfer", "havalimanı", "uçak", "uçağım", "istiyorum", "kisi", "kişilik", "kemer", "belek", "koltuk", "bar", "masaj", "wifi", "şehir", "içi"]
    time_match = re.search(r'(\d{1,2})[:.](\d{2})', message)
    
    has_keyword = any(c in msg_lower for c in cities) or any(kw in msg_lower for kw in transfer_keywords) or time_match
    
    if len(message.strip()) < 2 or not has_keyword:
        bot_response = "Yanlış veya anlaşılmayan bir talep girdiniz. Lütfen şehir ve kişi sayınızı belirtiniz. (Örn: İstanbul'da 2 kişilik bebek koltuklu araç istiyorum)"
        return bot_response, CARS_DATABASE

    # Kişi sayısı belirleme
    person_count = 4 # varsayılan
    for num in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]:
        if f"{num} kiş" in msg_lower or f"{num} kis" in msg_lower or f"{num} kişi" in msg_lower or f"{num} ins" in msg_lower:
            person_count = num
            break

    # Şehir tespiti
    detected_city = "Antalya" # varsayılan
    for c in cities:
        if c in msg_lower:
            detected_city = c.capitalize()
            break

    # Özellik Filtreleme (Bebek koltuğu vb.)
    required_feature = None
    if "bebek koltuğ" in msg_lower or "koltuk" in msg_lower:
        required_feature = "Bebek Koltuğu"
    elif "masaj" in msg_lower:
        required_feature = "Massage Seats"
    elif "mini bar" in msg_lower or "bar" in msg_lower:
        required_feature = "Mini Bar"
    elif "playstation" in msg_lower or "ps5" in msg_lower:
        required_feature = "PlayStation 5"
    elif "apple tv" in msg_lower:
        required_feature = "Apple TV"
    elif "ses sistemi" in msg_lower:
        required_feature = "Sound System"

    bot_response = ""
    
    # Eğer uçuş saati VARSA uçuş hesabı yap
    if time_match and ("uçak" in msg_lower or "uçağım" in msg_lower or "havalimanı" in msg_lower):
        dep_hour = int(time_match.group(1))
        dep_min = int(time_match.group(2))
        bot_response = (
            f"Talebinizi aldım! {detected_city} kalkışlı uçağınız için transfer planı oluşturulmuştur. "
            f"Saat {dep_hour:02d}:{dep_min:02d} itibarıyla VIP aracımız hazır olacaktır.\n\n"
            f"{person_count} kişilik grubunuz için en uygun araçlarımızı aşağıda listeledim."
        )
    else:
        # Saat yoksa veya sadece şehir içi araç isteniyorsa direkt şehir içi yanıtı ver
        feature_text = f" ve {required_feature} içeren" if required_feature else ""
        bot_response = (
            f"Talebinizi aldım! {detected_city} içinde kullanımınız için {person_count} kişilik{feature_text} VIP araçlarımızı aşağıda listeledim."
        )

    # Araç Filtreleme (Kapasite + Özellik)
    recommended = []
    for car in CARS_DATABASE:
        if car["capacity"] >= person_count:
            if required_feature:
                car_features_lower = [f.lower() for f in car["features"]]
                if required_feature.lower() in car_features_lower:
                    recommended.append(car)
            else:
                recommended.append(car)

    if not recommended:
        recommended = [car for car in CARS_DATABASE if car["capacity"] >= person_count]
    if not recommended:
        recommended = CARS_DATABASE

    return bot_response, recommended

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        response_text, recommended_cars = calculate_flight_and_recommend(request.message)
        return {
            "status": "success",
            "bot_response": response_text,
            "recommended_cars": recommended_cars
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/create-payment-intent")
async def create_payment_intent(request: PaymentRequest):
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(request.amount_eur * 100),
            currency="eur",
            metadata={"car_name": request.car_name}
        )
        return {"status": "success", "client_secret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)