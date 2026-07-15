import pandas as pd
import datetime

data = [
    {
        "Date": "2024-03-01",
        "OwnerEmpID": "CAB001",
        "OwnerStartTime": "08:00:00",
        "OwnerOfficeEntryTime": "09:00:00",
        "ParticipantEmpID": "E123",
        "ParticipantPickupTime": "08:15:00",
        "ParticipantOfficeEntryTime": "09:00:00",
        "PickupPoint": "Point A",
        "TripType": "BothWay",
        "CabBillRefID": "00000000-0000-0000-0000-000000000000"
    },
    {
        "Date": "2024-03-02",
        "OwnerEmpID": "E100",  # E100 needs KYC
        "OwnerStartTime": "08:10:00",
        "OwnerOfficeEntryTime": "09:05:00",
        "ParticipantEmpID": "E123",
        "ParticipantPickupTime": "08:20:00",
        "ParticipantOfficeEntryTime": "09:05:00",
        "PickupPoint": "Point B",
        "TripType": "OneWay",
        "CabBillRefID": ""
    },
    {
        "Date": "2024-03-03",
        "OwnerEmpID": "E100",
        "OwnerStartTime": "08:00:00",
        "OwnerOfficeEntryTime": "08:50:00",
        "ParticipantEmpID": "E123",
        "ParticipantPickupTime": "08:15:00",
        "ParticipantOfficeEntryTime": "09:05:00", # Gap > 10 mins (8:50 vs 9:05 is 15 mins gap)
        "PickupPoint": "Point C",
        "TripType": "BothWay",
        "CabBillRefID": ""
    }
]

df = pd.DataFrame(data)
df.to_excel("dummy_carpool_logs.xlsx", index=False)
print("Created dummy_carpool_logs.xlsx")
