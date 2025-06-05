curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-token-123" \
  -d '{
    "name": "Хлеб",
    "image_url": "https://cdn.nur.kz/images/1200x675/37714c611dde1638.jpeg",
    "description": "",
    "slug": "hleb",
    "enterprise_id": null,
    "manufacturer": "Брестский хлебозавод",
    "shelf_life": "48 часов",
    "proteins": "6,1 г",
    "fats": "0,5 г",
    "carbs": "47,2 г",
    "weight": "0,9 кг",
    "storage": "Хранить при температуре не ниже +6 ºС и относительной влажностью воздуха не более 75 %",
    "energy": "930 кДж (219 ккал)"
  }'
