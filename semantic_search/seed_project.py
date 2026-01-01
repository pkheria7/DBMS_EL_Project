#!/usr/bin/env python3
"""
seed_projects.py  –  one-shot upload of 5 sample projects
Python 3.12 ready
"""
import requests
import json

URL = "http://localhost:8000/add"   # change if you run on a different port

PAYLOADS = [
    {
        "title": "Solar-powered micro-cooling system for rural clinics",
        "abstract": "We present a 12 V DC micro-cooler that runs directly off a 200 W rooftop PV panel and uses a high-COP Peltier module to maintain 4 °C inside a 20 L vaccine compartment. The system stores excess daytime energy in a 20 Ah LiFePO₄ battery, enabling overnight operation without grid electricity. Laboratory tests show an internal temperature pull-down from 30 °C to 4 °C in 35 min with an average COP of 0.68. The prototype costs < 300 USD and can be assembled from off-the-shelf components, making it suitable for off-grid rural clinics in tropical regions."
    },
    {
        "title": "Agrivoltaic drip-irrigation controller",
        "abstract": "This work couples a 1.5 kW elevated PV array with a smart drip-irrigation kit to irrigate 0.4 ha of vegetable crops. A low-cost Arduino-based controller senses soil moisture and activates a 24 V DC pump only when the PV output exceeds 200 W, eliminating the need for batteries. Field trials in semi-arid India reduced water consumption by 32 % while increasing tomato yield by 18 % compared with conventional flood irrigation. The pay-back period is 2.1 years and the system can be replicated by local technicians with basic tools."
    },
    {
        "title": "Vehicle-integrated PV roof for electric car range extension",
        "abstract": "We integrate 1.2 kW peak of flexible monocrystalline solar cells onto the roof and hood of a compact electric vehicle. A high-voltage DC-DC converter feeds the traction battery directly, adding 8–12 km of city-driving range per sunny day. On-road measurements over six months show an average daily energy yield of 1.8 kWh in Madrid, equivalent to a 6 % reduction in grid-charging events. The add-on kit weighs 12 kg, costs < 900 EUR and pays for itself in 4.5 years under Spanish irradiance."
    },
    {
        "title": "Low-cost solar water pasteurizer for disaster relief",
        "abstract": "The proposed device uses a 50 W PV module to power an electric resistance coil that heats water to 75 °C for 15 min, achieving > 5-log reduction of E. coli without boiling. A thermochromic sticker provides visual confirmation of pasteurization, removing the need for thermometers. The 5 L batch unit is built from a recycled stainless-steel thermos and costs < 80 USD. Laboratory tests show compliance with WHO emergency water-quality standards and the system can be assembled by local NGOs within one hour."
    },
    {
        "title": "Solar sidewalk tile for pedestrian-area lighting",
        "abstract": "We embed 22 %-efficient silicon solar cells and a 15 Wh Li-ion cell inside a 300 mm × 300 mm tempered-glass paver that can be walked on. Each tile stores enough energy during the day to power a 0.5 W LED strip for 12 h at night. Impact tests show the tile withstands 5 kN point loads and slip resistance meets EN 13813. A 20-tile pilot installation in a city park eliminated 180 kg CO₂/year compared with grid-powered lighting and has an IRR of 11 %."
    }
]

def main():
    for idx, payload in enumerate(PAYLOADS, 1):
        try:
            r = requests.post(URL, json=payload, timeout=5)
            print(f"{idx}. {r.status_code} – {payload['title'][:50]}...")
            if r.status_code != 200:
                print("   ERROR:", r.text)
        except Exception as e:
            print(f"{idx}. FAILED – {e}")

if __name__ == "__main__":
    main()