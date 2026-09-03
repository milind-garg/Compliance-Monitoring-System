"""
Seed 10 mines, 1 admin + 3 users, compliance records, inspections, violations.
Run: python scripts/seed_data.py
"""
import asyncio
import os
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://cms:cms_secret@localhost:5432/cms",
)

engine = create_async_engine(DATABASE_URL, echo=False)
Session = async_sessionmaker(engine, expire_on_commit=False)

MINE_NAMES = [
    "Dhanbad Central Mine", "Jharia Coal Field", "Bokaro Deep Mine",
    "Singrauli North", "Korba East", "Raniganj Heritage Mine",
    "Bellary Iron Ore Mine", "Raigarh Underground", "Angul Block-3", "Talcher Open Cast",
]

LOCATIONS = [
    ("Dhanbad, Jharkhand", 23.7957, 86.4304),
    ("Jharia, Jharkhand", 23.7456, 86.4154),
    ("Bokaro, Jharkhand", 23.7064, 86.1511),
    ("Singrauli, MP", 24.1993, 82.6750),
    ("Korba, Chhattisgarh", 22.3595, 82.7501),
    ("Raniganj, WB", 23.6195, 87.1340),
    ("Bellary, Karnataka", 15.1394, 76.9214),
    ("Raigarh, Chhattisgarh", 21.8974, 83.3950),
    ("Angul, Odisha", 20.8405, 85.0992),
    ("Talcher, Odisha", 20.9499, 85.2307),
]


async def run():
    from passlib.context import CryptContext
    ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

    async with Session() as db:
        # ── Organisation ──────────────────────────────────────────────────────
        org_id = uuid.uuid4()
        await db.execute(
            __import__("sqlalchemy").text(
                "INSERT INTO auth.organisations (id, name, code) VALUES (:id, :name, :code) ON CONFLICT DO NOTHING"
            ),
            {"id": str(org_id), "name": "National Coal Authority", "code": "NCA"},
        )

        # ── Users ─────────────────────────────────────────────────────────────
        admin_id = uuid.uuid4()
        users_to_insert = [
            (admin_id, "admin@nca.gov.in", ctx.hash("Admin@1234"), "Admin User", "admin"),
            (uuid.uuid4(), "manager@nca.gov.in", ctx.hash("Manager@1234"), "Mine Manager", "manager"),
            (uuid.uuid4(), "inspector@nca.gov.in", ctx.hash("Inspector@1234"), "Field Inspector", "inspector"),
            (uuid.uuid4(), "viewer@nca.gov.in", ctx.hash("Viewer@1234"), "Report Viewer", "viewer"),
        ]
        for uid, email, pw, name, role in users_to_insert:
            await db.execute(
                __import__("sqlalchemy").text(
                    "INSERT INTO auth.users (id, organisation_id, email, hashed_password, full_name, role) "
                    "VALUES (:id, :org, :email, :pw, :name, :role) ON CONFLICT DO NOTHING"
                ),
                {"id": str(uid), "org": str(org_id), "email": email, "pw": pw, "name": name, "role": role},
            )

        # ── Mines ─────────────────────────────────────────────────────────────
        mine_ids = []
        for i, (name, (location, lat, lon)) in enumerate(zip(MINE_NAMES, LOCATIONS)):
            mid = uuid.uuid4()
            mine_ids.append(mid)
            await db.execute(
                __import__("sqlalchemy").text(
                    "INSERT INTO auth.mines (id, organisation_id, name, location, latitude, longitude, mine_type) "
                    "VALUES (:id, :org, :name, :loc, :lat, :lon, :mt) ON CONFLICT DO NOTHING"
                ),
                {
                    "id": str(mid), "org": str(org_id), "name": name,
                    "loc": location, "lat": lat, "lon": lon,
                    "mt": "underground" if i % 2 == 0 else "open_cast",
                },
            )

        # ── Compliance records (last 6 months) ────────────────────────────────
        now = datetime.now(timezone.utc)
        for mine_id in mine_ids:
            for m in range(6):
                period_start = now - timedelta(days=30 * (m + 1))
                period_end = period_start + timedelta(days=30)
                safety = round(random.uniform(55, 98), 2)
                env = round(random.uniform(50, 95), 2)
                labour = round(random.uniform(60, 99), 2)
                overall = round((safety + env + labour) / 3, 2)
                await db.execute(
                    __import__("sqlalchemy").text(
                        "INSERT INTO compliance.compliance_records "
                        "(id, mine_id, period_start, period_end, overall_score, safety_score, "
                        "environmental_score, labour_score, status, created_by) "
                        "VALUES (:id, :mine_id, :ps, :pe, :os, :ss, :es, :ls, :st, :cb) ON CONFLICT DO NOTHING"
                    ),
                    {
                        "id": str(uuid.uuid4()), "mine_id": str(mine_id),
                        "ps": period_start, "pe": period_end,
                        "os": overall, "ss": safety, "es": env, "ls": labour,
                        "st": "compliant" if overall >= 70 else "non_compliant",
                        "cb": str(admin_id),
                    },
                )

        # ── Inspections ───────────────────────────────────────────────────────
        inspector_id = users_to_insert[2][0]
        for mine_id in mine_ids:
            for _ in range(random.randint(1, 3)):
                sched = now - timedelta(days=random.randint(1, 90))
                status = random.choice(["completed", "completed", "scheduled"])
                await db.execute(
                    __import__("sqlalchemy").text(
                        "INSERT INTO inspection.inspections "
                        "(id, mine_id, inspector_id, inspection_type, scheduled_at, status) "
                        "VALUES (:id, :m, :i, :t, :s, :st) ON CONFLICT DO NOTHING"
                    ),
                    {
                        "id": str(uuid.uuid4()), "m": str(mine_id),
                        "i": str(inspector_id),
                        "t": random.choice(["routine", "surprise"]),
                        "s": sched, "st": status,
                    },
                )

        # ── Violations ────────────────────────────────────────────────────────
        categories = ["safety", "environmental", "labour"]
        severities = ["low", "medium", "high", "critical"]
        for mine_id in mine_ids:
            for _ in range(random.randint(0, 4)):
                await db.execute(
                    __import__("sqlalchemy").text(
                        "INSERT INTO violation.violations "
                        "(id, mine_id, category, severity, description, status, reported_by) "
                        "VALUES (:id, :m, :cat, :sev, :desc, :st, :rb) ON CONFLICT DO NOTHING"
                    ),
                    {
                        "id": str(uuid.uuid4()), "m": str(mine_id),
                        "cat": random.choice(categories),
                        "sev": random.choice(severities),
                        "desc": "Identified during routine inspection. Corrective action required.",
                        "st": random.choice(["open", "acknowledged", "resolved"]),
                        "rb": str(inspector_id),
                    },
                )

        await db.commit()
        print("Seed complete.")
        print(f"  Admin login: admin@nca.gov.in / Admin@1234")
        print(f"  {len(mine_ids)} mines, compliance records for last 6 months, inspections, violations seeded.")


if __name__ == "__main__":
    asyncio.run(run())
