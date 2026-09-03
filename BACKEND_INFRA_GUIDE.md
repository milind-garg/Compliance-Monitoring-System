# Backend, Infrastructure, AI/ML & DevOps Guide — Coal Mine Governance Platform

## Claude Code Prompt (Backend + AI/ML + DevOps — Members B & C)

---

> **Instructions for Claude Code:** This guide covers the **backend microservices, database, AI/ML, infrastructure, DevOps, and deployment** for the Coal Mine Governance & Compliance Monitoring System. Read this fully before starting. Ask clarifying questions from Section 1 before implementing. Proceed phase by phase.

---

## Table of Contents

1. [Clarifying Questions](#1-clarifying-questions)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Database Design](#4-database-design)
5. [API Design](#5-api-design)
6. [Backend Folder Structure](#6-backend-folder-structure)
7. [Microservice Implementation](#7-microservice-implementation)
8. [AI/ML Engine](#8-aiml-engine)
9. [Notification, Report, OCR, GIS Services](#9-supporting-services)
10. [Security](#10-security)
11. [Celery & Background Tasks](#11-celery--background-tasks)
12. [DevOps & Docker](#12-devops--docker)
13. [CI/CD Pipeline](#13-cicd-pipeline)
14. [AWS Deployment](#14-aws-deployment)
15. [Monitoring & Logging](#15-monitoring--logging)
16. [Performance & Optimization](#16-performance--optimization)
17. [Testing Strategy](#17-testing-strategy)
18. [Development Phases (Backend/Infra Tasks)](#18-development-phases)
19. [Team Division (Members B & C)](#19-team-division)
20. [Git Workflow](#20-git-workflow)
21. [Production Readiness](#21-production-readiness)

---

## 1. Clarifying Questions

> **Claude Code: Ask me these before starting backend work:**
>
> 1. **Mine count**: How many mines for the initial pilot? (affects DB partitioning and seeding)
> 2. **Existing data**: Do you have sample compliance checklists, DGMS forms, or inspection templates? Share them for seed data.
> 3. **Authentication**: Standalone JWT auth or integrate with SSO/LDAP?
> 4. **GIS data**: Do you have mine boundary shapefiles/KML, or manual polygon drawing only?
> 5. **IoT sensors**: Will this integrate with mine sensors, or all data is manually entered?
> 6. **Regulatory formats**: Can you share sample DGMS/MOEF report formats?
> 7. **SMS gateway**: Twilio, MSG91, or NIC SMS for India?
> 8. **AWS budget**: Monthly range? (determines ECS Fargate vs EC2 vs single-server)
> 9. **Domain name**: Do you have one?
> 10. **Demo data**: Generate synthetic data or use real data?

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Web App      │  │  Mobile App  │  │  Regulatory Portal   │   │
│  │  (Next.js)    │  │  (React      │  │  (Next.js)           │   │
│  │               │  │   Native)    │  │                      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
└─────────┼─────────────────┼─────────────────────┼────────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (FastAPI gateway service)         │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Rate Limiting │ Auth │ Load Balancing │ Request Routing  │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────┐
│                    MICROSERVICES LAYER                            │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│
│  │ Auth Service │ │ Compliance  │ │ Inspection  │ │ Violation  ││
│  │ (FastAPI)    │ │ Service     │ │ Service     │ │ Service    ││
│  │  :8001       │ │ (FastAPI)   │ │ (FastAPI)   │ │ (FastAPI)  ││
│  │              │ │  :8002      │ │  :8003      │ │  :8004     ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│
│  │ Contractor  │ │ Report      │ │ Notification │ │ AI/ML      ││
│  │ Service     │ │ Service     │ │ Service      │ │ Engine     ││
│  │  :8005      │ │  :8006      │ │  :8007       │ │  :8008     ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ GIS Service │ │ OCR Service │ │ Production  │               │
│  │  :8009      │ │  :8010      │ │ Service     │               │
│  │             │ │             │ │  :8011      │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└──────────────────────────────────────────────────────────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                   │
│  PostgreSQL 16 + PostGIS  │  Redis 7  │  MinIO/S3  │  RabbitMQ  │
│  Elasticsearch 8          │  TimescaleDB (extension)             │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Microservices Breakdown

| Service | Owner | Port | DB Schema | Responsibility |
|---------|-------|------|-----------|----------------|
| `gateway` | B | 8000 | — | Routing, rate limiting, auth middleware |
| `auth-service` | B | 8001 | `auth` | Auth, users, roles, RBAC, orgs, mines |
| `compliance-service` | B | 8002 | `compliance` | Compliance items, tracking, approvals, audit log |
| `inspection-service` | B | 8003 | `inspection` | Templates, scheduling, conduct, reports |
| `violation-service` | B | 8004 | `violation` | Violations, corrective actions, escalation |
| `contractor-service` | B | 8005 | `contractor` | Contractors, contracts, worker attendance |
| `production-service` | B | 8006 | `production` | Daily reports, shift data, equipment |
| `notification-service` | C | 8007 | `notification` | Email, SMS, push, in-app, WebSocket |
| `report-service` | C | 8008 | `report` | PDF/Excel generation, templates |
| `ai-engine` | C | 8009 | `ai` | ML models, risk scoring, anomaly detection |
| `gis-service` | C | 8010 | `gis` | Spatial queries, map data |
| `ocr-service` | C | 8011 | `ocr` | Document scanning, text extraction |

### 2.3 Communication Patterns
- **Synchronous**: REST between gateway ↔ services, frontend ↔ gateway
- **Asynchronous**: RabbitMQ for inter-service events
- **Cache**: Redis for sessions, dashboard stats, permissions, risk scores
- **Search**: Elasticsearch for full-text search

### 2.4 Event Bus (RabbitMQ Events)

| Event | Publisher | Consumer(s) | Payload |
|-------|-----------|-------------|---------|
| `inspection.completed` | inspection-service | violation-service, ai-engine, notification-service | `{inspection_id, mine_id, score, violations_found}` |
| `violation.created` | violation-service | notification-service, ai-engine | `{violation_id, mine_id, severity, assigned_to}` |
| `violation.overdue` | violation-service (Celery) | notification-service | `{violation_id, mine_id, days_overdue, escalation_level}` |
| `compliance.overdue` | compliance-service (Celery) | notification-service | `{tracking_id, mine_id, item_title, days_overdue}` |
| `compliance.approved` | compliance-service | notification-service | `{tracking_id, mine_id, approved_by}` |
| `risk.alert` | ai-engine | notification-service | `{mine_id, risk_score, alert_type, details}` |
| `user.created` | auth-service | notification-service | `{user_id, email, role}` |

---

## 3. Tech Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Backend Framework** | Python FastAPI | Async, auto-docs, Pydantic validation, ML ecosystem |
| **ORM** | SQLAlchemy 2.0 (async) | Mature, async support, PostGIS integration |
| **Migrations** | Alembic | Standard for SQLAlchemy |
| **Database** | PostgreSQL 16 + PostGIS | Robust, spatial queries, JSONB, partitioning |
| **Time-Series** | TimescaleDB (PG extension) | Production metrics, sensor data |
| **Cache** | Redis 7 | Sessions, caching, rate limiting |
| **Message Queue** | RabbitMQ | Reliable async messaging, management UI |
| **Task Queue** | Celery + Redis broker | Background jobs, scheduled tasks |
| **Search** | Elasticsearch 8 | Full-text search, log aggregation |
| **File Storage** | MinIO (dev) → S3 (prod) | S3-compatible API |
| **OCR** | Tesseract + PaddleOCR | Free, multilingual |
| **ML** | scikit-learn + XGBoost | No GPU needed, fast training |
| **NLP** | spaCy → Claude API (later) | Entity extraction, document understanding |
| **PDF Generation** | WeasyPrint | HTML-to-PDF, CSS-based templates |
| **Excel Generation** | openpyxl | Standard Python Excel library |
| **Containerization** | Docker + Docker Compose | Consistent environments |
| **CI/CD** | GitHub Actions | Free, Docker support |
| **Monitoring** | Prometheus + Grafana | Metrics, dashboards, alerting |
| **Logging** | structlog + ELK | Structured JSON logs, centralized |
| **Error Tracking** | Sentry | Error aggregation, performance |
| **Linting** | ruff | Fast, replaces flake8+isort+black |
| **Testing** | pytest + factory_boy + httpx | Async test client, data factories |

### 3.1 Open Source First → Paid Migration Path

| Function | Free/OSS (Phase 1) | Paid (when needed) |
|----------|--------------------|--------------------|
| NLP | spaCy, HuggingFace | Claude API |
| OCR | Tesseract + PaddleOCR | AWS Textract |
| Email | SMTP | AWS SES |
| SMS | — (in-app only) | MSG91 / Twilio |
| Storage | MinIO | AWS S3 |
| Search | Elasticsearch | AWS OpenSearch |
| Monitoring | Prometheus + Grafana | CloudWatch + Datadog |

---

## 4. Database Design

### 4.1 Schema Strategy
- Single PostgreSQL instance, **schema-per-service** isolation
- Schemas: `auth`, `compliance`, `inspection`, `violation`, `contractor`, `production`, `notification`, `ai`, `gis`, `ocr`, `report`
- Cross-schema references use UUID foreign keys
- PostGIS extension for spatial data (GEOGRAPHY type)
- TimescaleDB extension for time-series tables

### 4.2 Core Schemas

#### Auth Schema (`auth`)
```sql
CREATE SCHEMA auth;

CREATE TABLE auth.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,        -- 'subsidiary', 'regulatory_body'
    address JSONB,
    contact JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.mines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES auth.organizations(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,        -- 'opencast', 'underground', 'mixed'
    location GEOGRAPHY(POINT, 4326),
    boundary GEOGRAPHY(POLYGON, 4326),
    address JSONB,
    capacity_mtpa DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,       -- {"compliance.read": true, ...}
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(50),
    role_id UUID REFERENCES auth.roles(id),
    organization_id UUID REFERENCES auth.organizations(id),
    mine_id UUID REFERENCES auth.mines(id),
    designation VARCHAR(100),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    profile_photo_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Compliance Schema (`compliance`)
```sql
CREATE SCHEMA compliance;

CREATE TABLE compliance.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES compliance.categories(id),
    regulation_reference VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE compliance.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES compliance.categories(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    regulation_reference VARCHAR(255),
    frequency VARCHAR(50) NOT NULL,
    applicable_mine_types VARCHAR(50)[] DEFAULT '{opencast,underground,mixed}',
    severity VARCHAR(20) DEFAULT 'medium',
    evidence_required BOOLEAN DEFAULT true,
    checklist_template JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE compliance.tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES compliance.items(id),
    mine_id UUID NOT NULL,            -- FK to auth.mines
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    evidence_urls TEXT[],
    checklist_responses JSONB,
    remarks TEXT,
    risk_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(item_id, mine_id, period_start)
);

-- Immutable audit log — NO UPDATE/DELETE grants
CREATE TABLE compliance.audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_id UUID NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);
```

#### Inspection Schema (`inspection`)
```sql
CREATE SCHEMA inspection;

CREATE TABLE inspection.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    checklist JSONB NOT NULL,          -- [{id, question, type, options, required, category}]
    applicable_mine_types VARCHAR(50)[],
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inspection.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES inspection.templates(id),
    mine_id UUID NOT NULL,
    inspector_id UUID NOT NULL,
    scheduled_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'scheduled',
    location GEOGRAPHY(POINT, 4326),
    area_name VARCHAR(255),
    responses JSONB,
    summary TEXT,
    overall_score DECIMAL(5,2),
    photos TEXT[],
    signature_url VARCHAR(500),
    weather_conditions JSONB,
    sync_status VARCHAR(20) DEFAULT 'synced',
    offline_id VARCHAR(100) UNIQUE,   -- For mobile dedup
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Violation Schema (`violation`)
```sql
CREATE SCHEMA violation;

CREATE TABLE violation.violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID,               -- FK to inspection.inspections
    mine_id UUID NOT NULL,
    reported_by UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    area_name VARCHAR(255),
    photo_urls TEXT[],
    status VARCHAR(50) DEFAULT 'open',
    assigned_to UUID,
    due_date DATE,
    resolved_at TIMESTAMPTZ,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    root_cause TEXT,
    regulation_reference VARCHAR(255),
    risk_score DECIMAL(5,2),
    escalation_level INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE violation.corrective_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_id UUID REFERENCES violation.violations(id),
    action_description TEXT NOT NULL,
    assigned_to UUID,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    evidence_urls TEXT[],
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Contractor Schema (`contractor`)
```sql
CREATE SCHEMA contractor;

CREATE TABLE contractor.contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(15),
    address JSONB,
    license_details JSONB,
    insurance_details JSONB,
    safety_certifications JSONB,
    compliance_score DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    documents TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contractor.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID REFERENCES contractor.contractors(id),
    mine_id UUID NOT NULL,
    contract_number VARCHAR(100) UNIQUE,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    value DECIMAL(15,2),
    scope_of_work TEXT,
    terms JSONB,
    status VARCHAR(50) DEFAULT 'active',
    documents TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contractor.worker_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID REFERENCES contractor.contractors(id),
    mine_id UUID NOT NULL,
    worker_name VARCHAR(200) NOT NULL,
    worker_id VARCHAR(100),
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    location GEOGRAPHY(POINT, 4326),
    within_geofence BOOLEAN,
    shift VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (date);
```

### 4.3 Indexes
```sql
CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_org ON auth.users(organization_id);
CREATE INDEX idx_tracking_mine_status ON compliance.tracking(mine_id, status);
CREATE INDEX idx_tracking_due ON compliance.tracking(due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_violations_mine_status ON violation.violations(mine_id, status);
CREATE INDEX idx_violations_severity ON violation.violations(severity, status);
CREATE INDEX idx_inspections_mine_date ON inspection.inspections(mine_id, scheduled_date);
CREATE INDEX idx_audit_entity ON compliance.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON compliance.audit_log(actor_id, created_at);

-- GIS
CREATE INDEX idx_mines_location ON auth.mines USING GIST(location);
CREATE INDEX idx_violations_location ON violation.violations USING GIST(location);
CREATE INDEX idx_inspections_location ON inspection.inspections USING GIST(location);

-- Full-text search
CREATE INDEX idx_violations_fts ON violation.violations 
  USING GIN(to_tsvector('english', title || ' ' || description));
```

---

## 5. API Design

### 5.1 Conventions
- Base URL: `/api/v1/{service-path}`
- Auth: JWT Bearer token
- Pagination: Cursor-based (`?cursor=xxx&limit=20`)
- Filtering: Query params (`?status=open&severity=critical&mine_id=xxx`)
- Sorting: `?sort=created_at&order=desc`
- Errors: RFC 7807 Problem Details
- All timestamps: ISO 8601 with timezone

### 5.2 Error Format
```json
{
    "type": "https://api.coalmine-gov.in/errors/validation-error",
    "title": "Validation Error",
    "status": 422,
    "detail": "The due_date must be in the future",
    "instance": "/api/v1/compliance/tracking",
    "errors": [{"field": "due_date", "message": "Must be a future date", "code": "FUTURE_DATE_REQUIRED"}],
    "trace_id": "abc-123-def-456"
}
```

### 5.3 Endpoints

#### Auth (`/api/v1/auth`)
```
POST   /register              - Register user (admin only)
POST   /login                 - Login → JWT + refresh token
POST   /logout                - Invalidate session
POST   /refresh               - Refresh access token
GET    /me                    - Current user profile
PUT    /me                    - Update profile
POST   /forgot-password       - Request password reset
POST   /reset-password        - Reset with token
GET    /users                 - List users (admin, paginated)
GET    /users/:id             - Get user details
PUT    /users/:id             - Update user (admin)
DELETE /users/:id             - Deactivate user
GET    /roles                 - List roles
POST   /roles                 - Create role (admin)
PUT    /roles/:id             - Update role permissions
GET    /organizations         - List organizations
GET    /mines                 - List mines (filtered by user's org)
POST   /mines                 - Create mine (admin)
PUT    /mines/:id             - Update mine
```

#### Compliance (`/api/v1/compliance`)
```
GET    /categories            - List categories
POST   /categories            - Create category
GET    /items                 - List compliance items
POST   /items                 - Create item
GET    /items/:id             - Get item details
PUT    /items/:id             - Update item
GET    /tracking              - List tracking records
POST   /tracking              - Create tracking record
GET    /tracking/:id          - Get tracking details
PUT    /tracking/:id          - Update tracking
POST   /tracking/:id/approve  - Approve submission
POST   /tracking/:id/reject   - Reject with remarks
GET    /tracking/overdue      - List overdue items
GET    /tracking/summary      - Stats per mine
GET    /audit-log             - Query audit log
```

#### Inspections (`/api/v1/inspections`)
```
GET    /templates             - List templates
POST   /templates             - Create template
GET    /templates/:id         - Get with checklist
PUT    /templates/:id         - Update template
GET    /                      - List inspections
POST   /                      - Schedule inspection
GET    /:id                   - Get details
PUT    /:id                   - Update
POST   /:id/start             - Start inspection
POST   /:id/complete          - Complete
POST   /:id/photos            - Upload photos
POST   /sync                  - Bulk sync from mobile
GET    /stats                 - Statistics
```

#### Violations (`/api/v1/violations`)
```
GET    /                      - List violations
POST   /                      - Report violation
GET    /:id                   - Get details
PUT    /:id                   - Update
POST   /:id/assign            - Assign
POST   /:id/resolve           - Resolve
POST   /:id/verify            - Verify resolution
POST   /:id/escalate          - Escalate
GET    /:id/actions            - List corrective actions
POST   /:id/actions            - Add corrective action
PUT    /:id/actions/:actionId  - Update action
GET    /stats                  - Statistics
GET    /heatmap                - Geo-heatmap data
```

#### AI (`/api/v1/ai`)
```
GET    /risk-scores            - All mine risk scores
GET    /risk-scores/:mine_id   - Detailed breakdown
POST   /risk-scores/compute    - Trigger recomputation
GET    /anomalies              - Detected anomalies
GET    /predictions            - Compliance failure predictions
GET    /trends                 - Trend analysis
POST   /analyze-document       - OCR + entity extraction
```

#### Notifications (`/api/v1/notifications`)
```
GET    /                       - User's notifications
PUT    /:id/read               - Mark read
PUT    /read-all               - Mark all read
GET    /preferences            - Get preferences
PUT    /preferences            - Update preferences
WS     /ws                     - Real-time stream
```

### 5.4 Rate Limiting
| Pattern | Limit | Window |
|---------|-------|--------|
| `/auth/login` | 5 | 1 min |
| `/auth/forgot-password` | 3 | 10 min |
| `GET *` | 100 | 1 min |
| `POST/PUT *` | 30 | 1 min |
| `/ai/*` | 10 | 1 min |
| `/inspections/sync` | 5 | 1 min |

---

## 6. Backend Folder Structure

### 6.1 Service Template (each microservice follows this)

```
services/{service-name}/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app, routers, startup/shutdown
│   ├── config.py               # Pydantic Settings (env vars)
│   ├── database.py             # SQLAlchemy engine, session factory
│   ├── dependencies.py         # Shared FastAPI dependencies
│   │
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   └── {entity}.py
│   │
│   ├── schemas/                # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   └── {entity}.py
│   │
│   ├── api/                    # Route handlers
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── {entity}.py
│   │
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   └── {entity}_service.py
│   │
│   ├── repositories/           # Data access layer
│   │   ├── __init__.py
│   │   └── {entity}_repo.py
│   │
│   ├── events/                 # RabbitMQ publishers/consumers
│   │   ├── __init__.py
│   │   ├── publisher.py
│   │   └── consumer.py
│   │
│   ├── tasks/                  # Celery tasks
│   │   ├── __init__.py
│   │   └── {task_name}.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── auth.py             # JWT verification, permission check
│       ├── pagination.py       # Cursor pagination helper
│       ├── audit.py            # Audit log helper
│       └── exceptions.py       # Custom exceptions → RFC 7807
│
├── alembic/                    # DB migrations
│   ├── env.py
│   └── versions/
│
├── tests/
│   ├── conftest.py             # Fixtures: test DB, client, auth tokens
│   ├── factories.py            # factory_boy data factories
│   ├── unit/
│   │   └── test_{service}.py
│   └── integration/
│       └── test_{api}.py
│
├── alembic.ini
├── Dockerfile
├── requirements.txt
└── pyproject.toml              # ruff config
```

### 6.2 Full Monorepo Backend Layout

```
services/
├── gateway/                    # API Gateway
├── auth-service/
├── compliance-service/
├── inspection-service/
├── violation-service/
├── contractor-service/
├── production-service/
├── notification-service/
├── report-service/
├── ai-engine/                  # Different structure (see Section 8)
├── gis-service/
└── ocr-service/

packages/
├── shared-utils/               # Shared Python code
│   ├── auth.py                 # JWT verify, permission decorator
│   ├── pagination.py           # Cursor pagination
│   ├── audit.py                # Audit log middleware
│   ├── events.py               # RabbitMQ connection + publish helper
│   ├── exceptions.py           # RFC 7807 error handler
│   ├── logging.py              # structlog config
│   └── s3.py                   # S3/MinIO upload helpers
└── shared-types/               # Shared TypeScript types (for frontend)
```

---

## 7. Microservice Implementation Details

### 7.1 FastAPI Service Template (`main.py`)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine
from app.api.v1 import router as v1_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect DB, Redis, RabbitMQ
    yield
    # Shutdown: close connections

app = FastAPI(
    title=f"{settings.SERVICE_NAME} API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, ...)
app.include_router(v1_router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.SERVICE_NAME}
```

### 7.2 Repository Pattern

```python
# app/repositories/compliance_repo.py
class ComplianceTrackingRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, id: UUID) -> ComplianceTracking | None:
        return await self.session.get(ComplianceTracking, id)

    async def list_by_mine(self, mine_id: UUID, status: str | None, cursor: str | None, limit: int) -> list:
        query = select(ComplianceTracking).where(ComplianceTracking.mine_id == mine_id)
        if status:
            query = query.where(ComplianceTracking.status == status)
        if cursor:
            query = query.where(ComplianceTracking.id > cursor)
        query = query.order_by(ComplianceTracking.created_at.desc()).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_overdue(self) -> list:
        query = select(ComplianceTracking).where(
            ComplianceTracking.status.in_(['pending', 'in_progress']),
            ComplianceTracking.due_date < func.current_date()
        )
        result = await self.session.execute(query)
        return result.scalars().all()
```

### 7.3 Auth Middleware (shared)

```python
# packages/shared-utils/auth.py
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload  # {user_id, role, permissions, mine_id, org_id}
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

def require_permission(permission: str):
    async def check(user = Depends(get_current_user)):
        if not user.get("permissions", {}).get(permission):
            raise HTTPException(403, f"Missing permission: {permission}")
        return user
    return check
```

### 7.4 Audit Log Middleware

```python
# Auto-log all state changes
async def log_audit(entity_type: str, entity_id: UUID, action: str, 
                    actor: dict, changes: dict, request: Request):
    await session.execute(
        insert(AuditLog).values(
            entity_type=entity_type, entity_id=entity_id,
            action=action, actor_id=actor["user_id"],
            actor_role=actor["role"], changes=changes,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent"),
        )
    )
```

### 7.5 Mobile Sync Endpoint

```python
# POST /api/v1/inspections/sync
# Handles bulk upload from offline mobile app
@router.post("/sync")
async def sync_inspections(data: SyncPayload, user = Depends(get_current_user)):
    results = []
    for item in data.inspections:
        existing = await repo.get_by_offline_id(item.offline_id)
        if existing:
            if existing.updated_at > item.updated_at:
                results.append({"offline_id": item.offline_id, "status": "conflict", "server_version": existing})
            else:
                await repo.update(existing.id, item)
                results.append({"offline_id": item.offline_id, "status": "updated"})
        else:
            created = await repo.create(item)
            results.append({"offline_id": item.offline_id, "status": "created", "server_id": str(created.id)})
    return {"results": results}
```

---

## 8. AI/ML Engine

### 8.1 Folder Structure

```
services/ai-engine/
├── app/
│   ├── main.py
│   ├── config.py
│   │
│   ├── models/                 # ML model definitions
│   │   ├── risk_scorer.py      # XGBoost mine risk model
│   │   ├── failure_predictor.py # Random Forest compliance predictor
│   │   ├── anomaly_detector.py # Isolation Forest
│   │   ├── severity_classifier.py # SVM text classifier
│   │   └── entity_extractor.py # spaCy NER
│   │
│   ├── training/
│   │   ├── train_risk_scorer.py
│   │   ├── train_failure_predictor.py
│   │   ├── train_anomaly_detector.py
│   │   └── generate_synthetic_data.py
│   │
│   ├── inference/
│   │   ├── risk_scoring.py     # API endpoint logic
│   │   ├── anomaly_detection.py
│   │   └── predictions.py
│   │
│   ├── data/
│   │   ├── feature_engineering.py
│   │   └── data_loader.py
│   │
│   ├── api/v1/
│   │   ├── risk_scores.py
│   │   ├── anomalies.py
│   │   ├── predictions.py
│   │   └── trends.py
│   │
│   └── tasks/
│       ├── daily_risk_recompute.py   # Celery beat
│       └── weekly_retrain.py         # Celery beat
│
├── notebooks/                  # Jupyter for exploration
│   ├── 01_data_exploration.ipynb
│   ├── 02_feature_engineering.ipynb
│   └── 03_model_evaluation.ipynb
│
├── model_artifacts/            # Saved models (.joblib)
├── Dockerfile
└── requirements.txt
```

### 8.2 Model Specifications

#### Mine Risk Scorer (XGBoost)
```python
# Features per mine:
features = [
    'violation_count_30d',        # Violations in last 30 days
    'critical_violation_count',    # Critical severity count
    'compliance_rate',             # % of compliant items
    'overdue_count',               # Currently overdue items
    'avg_inspection_score',        # Average of last 10 inspections
    'days_since_last_inspection',  # Recency
    'corrective_action_closure_rate', # % of CAs closed on time
    'worker_attendance_rate',      # Average attendance
    'incident_count_90d',         # Incidents in 90 days
    'mine_type_encoded',          # opencast=0, underground=1, mixed=2
]
# Output: risk_score 0-100 (0=safe, 100=critical)
# Algorithm: XGBoost Regressor
# Training: Synthetic data initially, retrain weekly on real data
```

#### Compliance Failure Predictor (Random Forest)
```python
# Features per compliance tracking item:
features = [
    'days_until_due',
    'item_frequency_encoded',     # daily=1, weekly=7, monthly=30, ...
    'item_severity_encoded',      # critical=4, high=3, medium=2, low=1
    'mine_compliance_history',    # % on-time for this mine, last 6 months
    'item_compliance_history',    # % on-time for this item type, last 6 months
    'assigned_user_load',         # How many items assigned to this user
    'is_quarter_end',             # Compliance spikes at quarter end
    'days_since_last_completion', # For recurring items
]
# Output: probability of failure (0-1)
# Algorithm: Random Forest Classifier
```

#### Anomaly Detector (Isolation Forest)
```python
# Features (time-series per mine per day):
features = [
    'daily_production_tonnes',
    'worker_count',
    'equipment_utilization_pct',
    'violation_count',
    'inspection_count',
    'attendance_rate',
]
# Output: anomaly_flag (bool), anomaly_score (-1 to 0, lower = more anomalous)
# Algorithm: Isolation Forest (unsupervised)
```

### 8.3 Synthetic Data Generation

```python
# scripts/generate_synthetic_data.py
# Generates realistic mine operations data for model training:
# - 10 mines, 12 months of daily data
# - Realistic violation distributions (more in monsoon season)
# - Compliance patterns (higher failure rate at quarter-end)
# - Production data with seasonal variation
# - Injected anomalies (sudden drops, spikes) for anomaly detector training
```

### 8.4 Model Training Pipeline

```
1. Celery Beat triggers weekly retrain task
2. Feature engineering: query PostgreSQL, compute features per mine
3. Train model on all historical data (expanding window)
4. Evaluate: cross-validation, compare with previous model
5. If improved: save new model to S3, update model registry
6. Log metrics to Prometheus: accuracy, F1, training time
7. Load new model into memory on next inference request
```

### 8.5 Inference Caching

```python
# Risk scores cached in Redis (TTL: 1 hour)
# Cache key: f"risk_score:{mine_id}"
# Invalidated on: daily recomputation or manual trigger
# Compliance predictions cached (TTL: 1 hour)
# Anomaly results cached (TTL: 30 min)
```

---

## 9. Supporting Services

### 9.1 Notification Service (Member C)

**Channels:** In-app, Email (SMTP), WebSocket (real-time), Push (Expo Push for mobile), SMS (later)

**Architecture:**
```
RabbitMQ Event → Consumer → Route by notification type → Send via channel
                              │
                              ├── In-app: Save to notification table
                              ├── Email: Celery task → SMTP
                              ├── WebSocket: Broadcast to connected clients
                              ├── Push: Expo Push API
                              └── SMS: (future) MSG91 API
```

**WebSocket:** FastAPI WebSocket endpoint, authenticate with JWT query param, broadcast per-user.

### 9.2 Report Service (Member C)

**Stack:** WeasyPrint (HTML→PDF), openpyxl (Excel), Jinja2 (templates)

**Flow:**
1. Frontend requests report generation (POST with params: template, mines, date range)
2. Report service creates Celery task
3. Task queries data from relevant services (via internal APIs)
4. Renders Jinja2 HTML template with data
5. Converts to PDF (WeasyPrint) or Excel (openpyxl)
6. Uploads to S3
7. Returns download URL
8. Publishes `report.generated` event → notification

**Templates:** Compliance Summary, Inspection Report, Violation Report, Monthly Governance Report, DGMS-format reports.

### 9.3 GIS Service (Member C)

**Stack:** PostGIS spatial queries, GeoJSON output

**Endpoints:**
```
GET /mines/boundaries        - Mine boundary polygons (GeoJSON)
GET /violations/heatmap      - Violation density grid
GET /inspections/coverage    - Inspection location points
GET /spatial/within          - Points within mine boundary
```

### 9.4 OCR Service (Member C)

**Stack:** Tesseract (via pytesseract), PaddleOCR (for better Hindi support)

**Flow:**
1. Upload document image (JPEG/PNG/PDF)
2. Pre-process: deskew, denoise, enhance contrast (OpenCV)
3. OCR: extract raw text
4. NLP: entity extraction (dates, regulation refs, names) via spaCy
5. Return structured data + raw text

---

## 10. Security

### 10.1 Authentication
- JWT access tokens: 15 min expiry, HS256
- Refresh tokens: 7 days, one-time use, rotated on refresh
- Password: bcrypt, 12 salt rounds
- Password policy: min 8 chars, 1 uppercase, 1 number, 1 special
- Account lockout: 5 failed attempts → 15 min cooldown
- Revoke all sessions on password change

### 10.2 Authorization
- RBAC: permissions stored in role → checked via middleware
- Every endpoint decorated with `require_permission("resource.action")`
- Data scoping: users see only their org/mine data (enforced in queries)

### 10.3 API Security
- Rate limiting (Redis-backed)
- Input validation (Pydantic — all endpoints)
- SQL injection: impossible (SQLAlchemy ORM)
- CORS whitelist
- File upload: type + size validation, content-type check
- Request body limit: 10MB
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options, CSP
- S3 files: private bucket, pre-signed URLs (1-hour expiry)

### 10.4 Audit
- Immutable audit_log table (no UPDATE/DELETE grants)
- All state changes logged with actor, timestamp, IP, changes diff
- DB user for app has no DROP/TRUNCATE permissions

---

## 11. Celery & Background Tasks

### 11.1 Task Inventory

| Task | Schedule | Service | Description |
|------|----------|---------|-------------|
| `detect_overdue_compliance` | Every hour | compliance | Mark overdue items, publish events |
| `detect_overdue_violations` | Every hour | violation | Escalate overdue violations |
| `escalate_violations` | Daily 8 AM | violation | Auto-escalate by level |
| `recompute_risk_scores` | Daily 2 AM | ai-engine | Recompute all mine risk scores |
| `retrain_models` | Weekly Sunday 3 AM | ai-engine | Retrain ML models |
| `generate_scheduled_reports` | Monthly 1st, 1 AM | report | Auto-generate monthly reports |
| `send_deadline_reminders` | Daily 9 AM | notification | Remind users of upcoming deadlines |
| `cleanup_expired_sessions` | Daily midnight | auth | Remove expired refresh tokens |
| `compute_contractor_scores` | Weekly | contractor | Recompute contractor compliance scores |

### 11.2 Celery Config

```python
# celery_app.py
from celery import Celery
from celery.schedules import crontab

app = Celery('coalmine', broker=settings.REDIS_URL)

app.conf.beat_schedule = {
    'detect-overdue-compliance': {
        'task': 'compliance.tasks.detect_overdue',
        'schedule': crontab(minute=0),  # Every hour
    },
    'recompute-risk-scores': {
        'task': 'ai.tasks.recompute_risk_scores',
        'schedule': crontab(hour=2, minute=0),  # Daily 2 AM
    },
    # ... etc
}
```

---

## 12. DevOps & Docker

### 12.1 Docker Compose (Local Dev)

```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: coalmine_gov
      POSTGRES_USER: coalmine
      POSTGRES_PASSWORD: localdev
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U coalmine"]
      interval: 5s

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  rabbitmq:
    image: rabbitmq:3-management
    ports: ["5672:5672", "15672:15672"]

  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

  elasticsearch:
    image: elasticsearch:8.12.0
    ports: ["9200:9200"]
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    mem_limit: 1g

volumes:
  pgdata:
```

### 12.2 Multi-Stage Dockerfile (per service)

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### 12.3 Makefile

```makefile
dev:
	docker compose up -d
dev-backend:
	docker compose up -d
test:
	cd services/auth-service && pytest
	cd services/compliance-service && pytest
lint:
	cd services && ruff check .
migrate:
	cd services/auth-service && alembic upgrade head
	cd services/compliance-service && alembic upgrade head
seed:
	python scripts/seed-data.py
build:
	docker compose build
```

---

## 13. CI/CD Pipeline

### 13.1 CI (GitHub Actions — on PR)

```yaml
# .github/workflows/ci.yml
on:
  pull_request:
    branches: [develop, main]

jobs:
  lint-and-test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_DB: test_coalmine
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r services/auth-service/requirements.txt
      - run: ruff check services/
      - run: ruff format --check services/
      - run: cd services/auth-service && pytest --cov=app --cov-report=xml
      - uses: codecov/codecov-action@v4

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: github/codeql-action/init@v3
      - uses: actions/checkout@v4
      - run: pip-audit -r services/auth-service/requirements.txt
```

### 13.2 CD (on merge to develop → staging)

```yaml
# .github/workflows/cd-staging.yml
on:
  push:
    branches: [develop]

jobs:
  build-and-deploy:
    steps:
      - Build Docker images for each changed service
      - Push to ECR
      - Update ECS task definitions
      - Deploy (rolling update)
      - Run smoke tests (health check endpoints)
      - Notify team (Discord/Slack webhook)
```

---

## 14. AWS Deployment

### 14.1 Architecture

```
VPC (10.0.0.0/16)
├── Public Subnets (10.0.1.0/24, 10.0.2.0/24)
│   ├── ALB (Application Load Balancer) + SSL (ACM)
│   └── NAT Gateway
│
├── Private Subnets (10.0.3.0/24, 10.0.4.0/24)
│   ├── ECS Fargate Cluster
│   │   ├── auth-service (0.5 vCPU, 1GB)
│   │   ├── compliance-service (0.5 vCPU, 1GB)
│   │   ├── inspection-service (0.5 vCPU, 1GB)
│   │   ├── violation-service (0.5 vCPU, 1GB)
│   │   ├── notification-service (0.5 vCPU, 1GB)
│   │   ├── report-service (0.5 vCPU, 1GB)
│   │   ├── ai-engine (1 vCPU, 2GB)
│   │   ├── gis-service (0.5 vCPU, 1GB)
│   │   ├── ocr-service (0.5 vCPU, 1GB)
│   │   ├── gateway (0.5 vCPU, 1GB)
│   │   └── celery-worker (0.5 vCPU, 1GB)
│   │
│   ├── RDS PostgreSQL (db.t3.medium, Multi-AZ, 50GB)
│   ├── ElastiCache Redis (cache.t3.micro)
│   └── Amazon MQ RabbitMQ (mq.t3.micro)
│
├── S3 Buckets
│   ├── coalmine-photos
│   ├── coalmine-documents
│   ├── coalmine-ml-models
│   └── coalmine-reports
│
├── CloudFront (CDN for Next.js)
├── Route 53 (DNS)
├── ACM (SSL certificate)
├── SES (email)
├── ECR (container registry)
└── CloudWatch (logs, metrics, alarms)
```

### 14.2 Estimated Monthly Cost (1-5 mines pilot)

| Service | Spec | Est. Cost |
|---------|------|-----------|
| ECS Fargate | 12 tasks × 0.5 vCPU × 1GB | $60-80 |
| RDS PostgreSQL | db.t3.medium, Multi-AZ | $70-90 |
| ElastiCache Redis | cache.t3.micro | $15-20 |
| Amazon MQ | mq.t3.micro | $20-25 |
| S3 | 50GB | $5-10 |
| ALB | 1 ALB | $20-30 |
| CloudFront | 100GB | $10-15 |
| CloudWatch | Logs + metrics | $10-20 |
| SES | 10K emails | $1 |
| Route 53 | 1 zone | $0.50 |
| **Total** | | **$210-290/month** |

---

## 15. Monitoring & Logging

### 15.1 Prometheus Metrics

Each service exposes `/metrics` with:
- `http_requests_total{method, path, status}`
- `http_request_duration_seconds{method, path}`
- `db_query_duration_seconds{query_type}`
- `celery_task_duration_seconds{task_name}`
- `celery_task_failures_total{task_name}`
- Custom: `risk_score_computation_duration`, `ml_inference_duration`

### 15.2 Grafana Dashboards
- **System**: CPU, memory, request rate, error rate, latency per service
- **Business**: Compliance rate, violation count, inspection count, overdue items
- **ML**: Model accuracy, inference latency, retraining frequency

### 15.3 Alerting Rules
| Alert | Condition | Severity |
|-------|-----------|----------|
| Service Down | Health check fails 3× | Critical |
| High Error Rate | 5xx > 5% for 5 min | Critical |
| Slow Response | p95 latency > 2s for 5 min | Warning |
| DB Connection Pool | > 80% utilized | Warning |
| Disk Space | > 85% used | Warning |
| Celery Queue Depth | > 100 pending tasks | Warning |

### 15.4 Structured Logging

```python
# Every log line is JSON with:
import structlog
logger = structlog.get_logger()

logger.info("compliance_created",
    tracking_id=str(tracking.id),
    mine_id=str(tracking.mine_id),
    user_id=str(user.id),
    status=tracking.status,
)
# Output: {"event": "compliance_created", "tracking_id": "...", "timestamp": "...", "level": "info"}
```

---

## 16. Performance & Optimization

### 16.1 Caching (Redis)

| Data | TTL | Invalidation |
|------|-----|-------------|
| Dashboard stats | 5 min | On new event |
| User permissions | 15 min | On role update |
| Compliance items | 1 hour | On CRUD |
| Risk scores | 1 hour | On recomputation |
| Mine list | 1 hour | On mine CRUD |
| Static reference data | 24 hours | Manual |

### 16.2 Database
- Connection pool: 10-20 per service (SQLAlchemy async)
- Read replica for report queries (RDS)
- Materialized views for dashboard aggregations
- Partial indexes on status columns
- EXPLAIN ANALYZE on all queries
- pg_stat_statements monitoring

### 16.3 API
- Response compression (gzip)
- No `SELECT *` — select only needed columns
- Batch operations where possible
- Celery for heavy operations
- ETags for conditional GET

---

## 17. Testing Strategy

### 17.1 Backend Testing (pytest)

**Target: 80% coverage**

```python
# tests/conftest.py
@pytest.fixture
async def db_session():
    # Create test schema, yield session, rollback after test

@pytest.fixture
async def client(db_session):
    # httpx.AsyncClient with test app

@pytest.fixture
async def admin_headers():
    # JWT token for admin role

@pytest.fixture
async def inspector_headers():
    # JWT token for inspector role
```

**Unit tests:** Business logic, validators, feature engineering, model inference
**Integration tests:** API endpoints with real DB, auth flow, cross-service events
**Load tests:** Locust or k6 — 500 concurrent users, measure p95 latency

### 17.2 Test Coverage Targets

| Service | Unit | Integration | Target |
|---------|------|-------------|--------|
| auth | 90% | 80% | 85% |
| compliance | 85% | 80% | 80% |
| inspection | 85% | 75% | 80% |
| violation | 85% | 75% | 80% |
| ai-engine | 80% | 70% | 75% |
| notification | 75% | 70% | 70% |

---

## 18. Development Phases (Backend/Infra Tasks)

### Phase 0 (Week 1): Infrastructure Setup

**Member B:**
- [ ] Initialize monorepo, create folder structure
- [ ] Write Docker Compose (postgres, redis, rabbitmq, minio, elasticsearch)
- [ ] Create FastAPI service template (main.py, config, database, health check)
- [ ] Create all DB schemas and initial Alembic migrations
- [ ] Create shared-utils package (auth, pagination, audit, exceptions, events)
- [ ] Set up GitHub repo, branch protection rules
- [ ] Write Makefile

**Member C:**
- [ ] Set up RabbitMQ exchanges and queues config
- [ ] Set up Celery with Redis broker + beat scheduler
- [ ] Create MinIO buckets (photos, documents, models)
- [ ] Write seed data script (orgs, mines, users, roles, sample compliance items)
- [ ] Set up Elasticsearch index mappings
- [ ] Set up Sentry project

**Verify:** `make dev` starts all infra. Health checks pass. Migrations run. Seed data loads.

### Phase 1 (Weeks 2-4): Core Services

**Member B:**
- [ ] Auth service: full implementation (register, login, JWT, refresh, RBAC, user CRUD, org/mine CRUD)
- [ ] Compliance service: categories CRUD, items CRUD, tracking CRUD, approval workflow
- [ ] Audit log middleware on both services
- [ ] Overdue detection Celery task (compliance)
- [ ] Dashboard aggregation API endpoint
- [ ] Redis caching for dashboard stats

**Member C:**
- [ ] Notification service skeleton: in-app notifications table, CRUD, WebSocket
- [ ] Elasticsearch indexing for compliance items
- [ ] RabbitMQ consumer for compliance events → notifications

**Verify:** Auth flow works. Compliance CRUD works. RBAC blocks unauthorized. Dashboard stats return. Audit log populated.

### Phase 2 (Weeks 5-7): Inspections, Violations, Notifications

**Member B:**
- [ ] Inspection service: templates, scheduling, conduct, complete, scoring
- [ ] Violation service: CRUD, corrective actions, status workflow, escalation
- [ ] Auto-violation creation from failed inspection items
- [ ] Mobile sync endpoint (POST /inspections/sync)
- [ ] S3 photo upload (pre-signed URL flow)

**Member C:**
- [ ] Notification service: email (SMTP), push (Expo Push)
- [ ] RabbitMQ consumers: inspection.completed, violation.created, violation.overdue
- [ ] WebSocket real-time notifications
- [ ] Notification preferences per user
- [ ] Escalation Celery task (violation overdue → escalate level)

**Verify:** Full inspection lifecycle works. Violations auto-created from inspections. Notifications sent (email + in-app + WebSocket). Escalation fires.

### Phase 3 (Weeks 8-10): AI, Reports, Maps, OCR

**Member B:**
- [ ] Report service: PDF generation (WeasyPrint), Excel (openpyxl), templates
- [ ] Statutory report templates (compliance summary, inspection report)
- [ ] API optimization: add caching to all list endpoints
- [ ] Pagination + filtering on all endpoints

**Member C:**
- [ ] AI engine: generate synthetic training data
- [ ] Train XGBoost risk scorer, Random Forest predictor, Isolation Forest anomaly detector
- [ ] Risk scoring API, anomaly API, predictions API
- [ ] Celery beat: daily risk recompute, weekly retrain
- [ ] Model versioning + S3 storage
- [ ] GIS service: PostGIS spatial queries, GeoJSON endpoints
- [ ] OCR service: Tesseract integration, document upload + extraction

**Verify:** ML models trained and serving predictions. Risk scores update daily. PDF reports generate. Maps return GeoJSON. OCR extracts text.

### Phase 4 (Weeks 11-12): Mobile Backend

**Member B:**
- [ ] Mobile-optimized API endpoints (smaller payloads, compressed)
- [ ] Bulk sync endpoint refinement (conflict resolution)
- [ ] Offline conflict detection and resolution strategy

**Member C:**
- [ ] Push notification integration (Expo Push Notifications)
- [ ] Background sync optimization
- [ ] Attendance service: geo-fenced check-in/out validation

**Verify:** Mobile sync works with conflicts. Push notifications delivered. Attendance geo-validation works.

### Phase 5 (Weeks 13-14): Polish & Testing

**Member B:**
- [ ] Contractor service: CRUD, contracts, worker attendance
- [ ] Production service: daily reports, shift data
- [ ] Unit tests for all services (80% target)
- [ ] Integration tests for all API flows

**Member C:**
- [ ] Integration tests for cross-service flows
- [ ] Load testing (Locust: 500 concurrent users)
- [ ] ML model retraining pipeline end-to-end test
- [ ] Security audit (OWASP Top 10 checklist)

**Verify:** 80% test coverage. Load test passes (p95 < 1s). No critical security issues.

### Phase 6 (Weeks 15-16): AWS Deployment

**Member B:**
- [ ] VPC, subnets, security groups
- [ ] RDS PostgreSQL (Multi-AZ), apply migrations
- [ ] ElastiCache Redis
- [ ] Amazon MQ RabbitMQ
- [ ] ECS Fargate cluster + task definitions per service
- [ ] ALB + ACM SSL certificate
- [ ] Route 53 DNS
- [ ] S3 buckets + lifecycle policies
- [ ] CI/CD: GitHub Actions → ECR → ECS
- [ ] CloudWatch log groups and alarms

**Member C:**
- [ ] Prometheus + Grafana setup (or CloudWatch dashboards)
- [ ] Alert rules configuration
- [ ] Deployment runbook documentation
- [ ] Production seed data (reference data)
- [ ] Post-deployment smoke tests
- [ ] Rollback procedure test

**Verify:** All services running on AWS. SSL enforced. Backups configured. Monitoring alerts work. Rollback tested.

---

## 19. Team Division

| Area | Member B (Backend Lead) | Member C (AI/ML + Backend) |
|------|------------------------|---------------------------|
| Core services | auth, compliance, inspection, violation, contractor, production | notification, report, ai-engine, gis, ocr |
| Infrastructure | Docker, DB schemas, migrations, gateway | RabbitMQ, Celery, Elasticsearch, MinIO |
| DevOps | GitHub Actions CI/CD, AWS infra | Prometheus, Grafana, monitoring, alerting |
| Testing | Unit + integration tests (own services) | Integration tests, load testing, security audit |
| Data | DB design, indexes, query optimization | ML models, synthetic data, feature engineering |

---

## 20. Git Workflow

### Branch Naming
```
feature/auth-service
feature/compliance-service
feature/inspection-service
feature/ai-risk-scorer
feature/notification-websocket
feature/report-pdf-generation
fix/auth-token-refresh
```

### Commit Convention
```
feat(auth): implement JWT refresh token rotation
feat(compliance): add overdue detection Celery task
feat(ai): train XGBoost mine risk scorer
feat(notification): add WebSocket real-time delivery
fix(violation): correct escalation level calculation
perf(compliance): add Redis caching for dashboard stats
test(auth): add integration tests for RBAC middleware
chore(infra): add Elasticsearch to Docker Compose
```

### PR Checklist
- [ ] `ruff check` passes
- [ ] `ruff format --check` passes
- [ ] `pytest` passes with no failures
- [ ] New endpoints have Pydantic schemas (request + response)
- [ ] New endpoints have OpenAPI docs (auto from FastAPI)
- [ ] New state changes logged in audit_log
- [ ] RBAC middleware applied to new endpoints
- [ ] No hardcoded secrets
- [ ] No `print()` statements (use structlog)
- [ ] Migration file included if DB changes

---

## 21. Production Readiness Checklist

**Infrastructure:**
- [ ] AWS resources provisioned
- [ ] SSL certificates configured
- [ ] DNS propagated
- [ ] DB backups: daily, 30-day retention
- [ ] Multi-AZ failover tested
- [ ] Auto-scaling policies set
- [ ] CloudWatch alarms active

**Application:**
- [ ] All env vars set in production
- [ ] Debug mode OFF
- [ ] CORS restricted
- [ ] Rate limiting ON
- [ ] Sentry connected
- [ ] Health checks responding
- [ ] Migrations applied
- [ ] Reference data seeded

**Security:**
- [ ] HTTPS enforced
- [ ] No default passwords
- [ ] Secrets in AWS Secrets Manager
- [ ] VPC security groups locked down
- [ ] S3 buckets private
- [ ] API keys rotated

**Monitoring:**
- [ ] Metrics scraped
- [ ] Dashboards built
- [ ] Alert rules active
- [ ] Logs aggregated
- [ ] On-call defined

**Rollback Procedure:**
1. Identify failing service (CloudWatch)
2. Roll back ECS task definition to previous version
3. If DB migration: run alembic downgrade
4. Verify health checks
5. Notify team
6. Post-mortem within 24 hours

---

## Appendix: Environment Variables

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/coalmine_gov
DATABASE_POOL_SIZE=10

# Redis
REDIS_URL=redis://localhost:6379/0

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/

# S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_PHOTOS=inspection-photos
S3_BUCKET_DOCUMENTS=documents
S3_BUCKET_MODELS=ml-models

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# JWT
JWT_SECRET_KEY=change-me-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@coalmine-gov.in

# Sentry
SENTRY_DSN=

# App
APP_ENV=development
APP_DEBUG=true
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000

# AI Engine
ML_MODEL_PATH=./model_artifacts
RISK_SCORE_RECOMPUTE_SCHEDULE=0 2 * * *
```

---

## Appendix: Architecture Decision Records

### ADR-001: Microservices with shared PostgreSQL
**Decision:** Schema-per-service on single PostgreSQL instance.
**Why:** True DB-per-service is overkill for 3-person team. Schema isolation gives logical separation with operational simplicity.

### ADR-002: FastAPI over Django
**Decision:** FastAPI for all services.
**Why:** Async-native, auto-docs, better for microservices. No admin panel needed — built in Next.js.

### ADR-003: XGBoost over Neural Networks
**Decision:** Traditional ML (scikit-learn, XGBoost) for all models.
**Why:** Structured/tabular data. Small datasets. No GPU needed. Fast training. Interpretable (SHAP).

### ADR-004: RabbitMQ over Kafka
**Decision:** RabbitMQ for event bus.
**Why:** Simpler operations, good enough throughput for our scale, built-in management UI. Kafka is overkill.

### ADR-005: WeasyPrint over wkhtmltopdf
**Decision:** WeasyPrint for PDF generation.
**Why:** Pure Python, CSS-based templates, no binary dependency issues in Docker.

---

> **To Claude Code:** After reading this document, ask the 10 clarifying questions from Section 1. Then start with Phase 0 infrastructure setup. Build each service following the template structure. Test each endpoint via Swagger docs before moving on. Coordinate with frontend team on API contracts — share the Swagger JSON.
