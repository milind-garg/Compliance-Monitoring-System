# AI-Based Smart Governance & Compliance Monitoring System for Coal Mines

## Complete Project Development Guide & Claude Code Prompt

---

> **Instructions for Claude Code:** Before starting any implementation, read this entire document. Then ask me clarifying questions about any section marked with `[CLARIFY]`. Do not assume — ask. After the Q&A round, proceed phase by phase, checking off each item before moving to the next. Always commit working code; never leave half-finished implementations.

---

## Table of Contents

1. [Project Analysis](#1-project-analysis)
2. [Requirements Specification (SRS)](#2-software-requirements-specification)
3. [Product Requirements Document (PRD)](#3-product-requirements-document)
4. [System Architecture](#4-system-architecture)
5. [Tech Stack](#5-tech-stack)
6. [Database Design](#6-database-design)
7. [API Design](#7-api-design)
8. [Folder Structure](#8-folder-structure)
9. [ML/AI Models](#9-ml-ai-models)
10. [UI/UX Design Plan](#10-ui-ux-design-plan)
11. [Development Roadmap & Phases](#11-development-roadmap)
12. [Team Division (3 Members)](#12-team-division)
13. [Git Workflow & Commit Strategy](#13-git-workflow)
14. [Testing Strategy](#14-testing-strategy)
15. [Security Plan](#15-security-plan)
16. [DevOps & Deployment (AWS)](#16-devops--deployment)
17. [Performance & Optimization](#17-performance--optimization)
18. [Phase Verification Checklists](#18-phase-verification-checklists)
19. [Page-Level Feature Checklists](#19-page-level-feature-checklists)
20. [Production Readiness](#20-production-readiness)

---

## 1. Project Analysis

### 1.1 Main Goal
Build a centralized, AI-enabled governance and compliance monitoring platform for Indian coal mining operations — covering statutory compliance, inspections, safety, environment, contractor management, and operational reporting.

### 1.2 Desired Outcome
A production-grade, scalable SaaS platform deployable across multiple coal mines and subsidiaries with real-time monitoring, AI-driven risk detection, mobile field reporting, and automated compliance workflows.

### 1.3 Hidden Objectives
- Replace fragmented Excel/paper-based systems across mines
- Provide audit-ready digital trails for regulatory bodies (DGMS, MOEF, CIL)
- Reduce compliance violations through predictive alerts
- Enable paperless governance at scale
- Academic project with production-grade quality for faculty review
- Eventually deploy for real coal mine operations (whole college first, then pilot)

### 1.4 Technical Domain
- Industrial IoT & Governance Tech
- RegTech (Regulatory Technology)
- GIS/Geospatial Systems
- AI/ML for anomaly detection & risk scoring
- Mobile-first field operations

### 1.5 Business Requirements
| ID | Requirement | Priority |
|----|------------|----------|
| BR-01 | Track 100+ statutory compliance items per mine | P0 |
| BR-02 | Real-time inspection & violation tracking | P0 |
| BR-03 | AI risk scoring for mines, contractors, areas | P0 |
| BR-04 | Mobile app for field officers with offline support | P0 |
| BR-05 | Multi-mine, multi-subsidiary deployment | P0 |
| BR-06 | Automated report generation (DGMS, MOEF formats) | P1 |
| BR-07 | Contractor performance & compliance scoring | P1 |
| BR-08 | GIS mapping of mine areas, incidents, inspections | P1 |
| BR-09 | OCR-based document digitization | P2 |
| BR-10 | Multilingual support (Hindi, English, regional) | P2 |
| BR-11 | Blockchain-based audit trails | P3 |

### 1.6 Functional Requirements
| ID | Module | Requirement |
|----|--------|------------|
| FR-01 | Auth | Role-based access: Super Admin, Subsidiary Admin, Mine Manager, Inspector, Field Officer, Contractor, Regulatory Authority |
| FR-02 | Compliance | Track safety, environment, production, labour compliance with deadlines, evidence upload, approval workflows |
| FR-03 | Inspections | Schedule, conduct, report inspections with geo-tagged photos, checklists, violation tagging |
| FR-04 | Safety | Incident reporting, safety observations, near-miss tracking, corrective action management |
| FR-05 | Violations | Log violations, assign corrective actions, track resolution, escalation on overdue |
| FR-06 | Contractors | Contractor registration, compliance verification, performance scoring, contract tracking |
| FR-07 | Production | Daily production reports, shift-wise data, equipment utilization |
| FR-08 | Environment | Environmental parameter monitoring, emission tracking, green compliance |
| FR-09 | Attendance | Worker attendance with geo-fencing, contractor labour tracking |
| FR-10 | Grievance | Grievance submission, assignment, tracking, resolution |
| FR-11 | Reports | Automated statutory reports, custom dashboards, export (PDF, Excel) |
| FR-12 | Alerts | Automated reminders, escalations, SMS/email/push notifications |
| FR-13 | AI Engine | Risk scoring, anomaly detection, predictive compliance alerts, trend analysis |
| FR-14 | GIS | Mine maps, incident heat maps, geo-tagged activities overlay |
| FR-15 | OCR | Scan and digitize paper compliance documents, extract structured data |
| FR-16 | Audit Trail | Immutable log of all actions, approvals, modifications |
| FR-17 | Mobile | Offline-capable field app for inspections, attendance, incident reporting |

### 1.7 Non-Functional Requirements
| ID | Requirement | Target |
|----|------------|--------|
| NFR-01 | Response time | < 200ms API, < 2s page load |
| NFR-02 | Availability | 99.9% uptime |
| NFR-03 | Concurrent users | 500+ simultaneous |
| NFR-04 | Data retention | 7 years (regulatory requirement) |
| NFR-05 | Offline sync | Mobile app works offline, syncs when connected |
| NFR-06 | Scalability | Horizontal scaling to 100+ mines |
| NFR-07 | Security | OWASP Top 10 compliant, data encryption at rest & transit |
| NFR-08 | Accessibility | WCAG 2.1 AA |
| NFR-09 | Localization | Hindi + English minimum |
| NFR-10 | Audit logging | Every state change logged immutably |

### 1.8 Complexity Level
**Very High** — Multi-module enterprise platform with AI/ML, mobile apps, GIS, OCR, microservices, real-time processing, offline sync, and regulatory compliance requirements.

### 1.9 Missing Information — `[CLARIFY]`

> **Claude Code: Ask me these questions before starting implementation:**
>
> 1. **Mine count**: How many mines will the initial pilot cover? (affects DB partitioning strategy)
> 2. **Existing data**: Do you have sample compliance checklists, inspection forms, or statutory formats (DGMS Form-III, Form-V, etc.)? If yes, share them.
> 3. **Authentication**: Should we integrate with any existing SSO/LDAP (like CIL's internal systems), or standalone auth is fine for now?
> 4. **GIS data**: Do you have mine boundary shapefiles/KML files, or should we support manual polygon drawing on maps?
> 5. **IoT sensors**: Will this integrate with any existing mine sensors (gas detectors, seismic monitors), or is all data manually entered?
> 6. **Regulatory formats**: Can you share sample DGMS/MOEF report formats that the system needs to generate?
> 7. **SMS gateway**: Which SMS provider for India — Twilio, MSG91, or government NIC SMS gateway?
> 8. **Language**: Beyond Hindi and English, which regional languages are needed?
> 9. **Budget**: What's the monthly AWS budget range? (affects architecture choices — single EC2 vs ECS Fargate vs EKS)
> 10. **Domain name**: Do you have a domain, or should we plan for one?
> 11. **Team skillset**: What are each team member's primary skills? (frontend/backend/ML/DevOps)
> 12. **Timeline**: What is the submission/presentation deadline?
> 13. **Demo data**: Should we generate synthetic mine data for demo, or will real data be provided?
> 14. **Mobile platform**: React Native (cross-platform) or separate Android (Kotlin) + iOS (Swift)?
> 15. **Blockchain**: Is blockchain audit trail a hard requirement or a nice-to-have? (significant complexity addition)

---

## 2. Software Requirements Specification

### 2.1 System Overview

The system is a multi-tenant, microservices-based platform with:
- **Web Application**: Admin dashboards, compliance management, reporting
- **Mobile Application**: Field operations, inspections, attendance
- **AI/ML Engine**: Risk scoring, anomaly detection, predictive analytics
- **Notification Service**: SMS, email, push notifications, escalations
- **GIS Service**: Map rendering, geo-tagging, spatial queries
- **OCR Service**: Document scanning, data extraction
- **Report Service**: Automated statutory report generation

### 2.2 User Roles & Permissions Matrix

| Permission | Super Admin | Subsidiary Admin | Mine Manager | Inspector | Field Officer | Contractor | Regulatory |
|-----------|:-----------:|:----------------:|:------------:|:---------:|:-------------:|:----------:|:----------:|
| Manage users | ✅ | Own subsidiary | Own mine | ❌ | ❌ | ❌ | ❌ |
| View all mines | ✅ | Own subsidiary | Own mine | Assigned | Assigned | Assigned | All (read) |
| Create compliance | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Conduct inspection | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Report incident | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View reports | ✅ | ✅ | ✅ | ✅ | Limited | Limited | ✅ |
| AI insights | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Manage contractors | ✅ | ✅ | ✅ | ❌ | ❌ | Own profile | ❌ |
| Approve actions | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Export data | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

### 2.3 System Constraints
- Must work on 3G/4G connections in remote mine areas
- Mobile app must function offline for up to 48 hours
- Must comply with Indian IT Act 2000, Data Protection laws
- All timestamps in IST (Asia/Kolkata)
- File uploads: max 10MB per file, 50MB per inspection report
- Support for low-end Android devices (Android 8+, 2GB RAM)

---

## 3. Product Requirements Document

### 3.1 Product Vision
"One platform to digitize, monitor, and optimize governance across every coal mine in India — making compliance automatic, insights real-time, and accountability transparent."

### 3.2 Success Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Compliance tracking coverage | 100% of statutory items digitized | Count of tracked vs total items |
| Inspection turnaround | 50% reduction in report submission time | Average time from inspection to report |
| Violation resolution | 30% faster corrective action closure | Average days to resolve |
| Report generation | 90% reduction in manual report effort | Time comparison |
| User adoption | 80% daily active users among field staff | DAU/total users |
| System uptime | 99.9% | Monitoring dashboard |

### 3.3 Feature Priority (MoSCoW)

**Must Have (MVP — Phase 1-2):**
- User management with RBAC
- Compliance tracking with deadlines & evidence
- Inspection management (create, conduct, report)
- Violation & corrective action tracking
- Dashboard with key metrics
- Mobile app with offline support
- Notification system (email + in-app)
- Basic reporting (PDF export)

**Should Have (Phase 3):**
- AI risk scoring engine
- GIS mapping & heat maps
- Contractor management
- Production reporting
- Automated statutory reports
- SMS notifications
- Advanced analytics dashboard

**Could Have (Phase 4):**
- OCR document digitization
- Multilingual interface
- Environmental monitoring
- Worker attendance with geo-fencing
- Grievance management
- Predictive analytics

**Won't Have (Future):**
- Blockchain audit trails
- IoT sensor integration
- AR-based field inspection
- Voice-based reporting

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Web App      │  │  Mobile App  │  │  Regulatory Portal   │   │
│  │  (Next.js)    │  │  (React      │  │  (Next.js - separate │   │
│  │               │  │   Native)    │  │   deployment)        │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
└─────────┼─────────────────┼─────────────────────┼────────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Kong / AWS API Gateway)          │
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
│  │              │ │ (FastAPI)   │ │ (FastAPI)   │ │ (FastAPI)  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│
│  │ Contractor  │ │ Report      │ │ Notification │ │ AI/ML      ││
│  │ Service     │ │ Service     │ │ Service      │ │ Engine     ││
│  │ (FastAPI)   │ │ (FastAPI)   │ │ (FastAPI)    │ │ (FastAPI)  ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ GIS Service │ │ OCR Service │ │ Production  │               │
│  │ (FastAPI)   │ │ (FastAPI)   │ │ Service     │               │
│  │             │ │             │ │ (FastAPI)   │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└──────────────────────────────────────────────────────────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                   │
│                                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ PostgreSQL   │ │ Redis        │ │ MinIO / S3   │             │
│  │ (Primary DB) │ │ (Cache +     │ │ (File        │             │
│  │              │ │  Queue +     │ │  Storage)    │             │
│  │              │ │  Sessions)   │ │              │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│                                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ RabbitMQ     │ │ Elasticsearch│ │ TimescaleDB  │             │
│  │ (Message     │ │ (Search +    │ │ (Time-series │             │
│  │  Broker)     │ │  Logs)       │ │  data)       │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Microservices Breakdown

| Service | Responsibility | Port | DB Schema |
|---------|---------------|------|-----------|
| `auth-service` | Authentication, authorization, user management, RBAC | 8001 | `auth` |
| `compliance-service` | Compliance items, deadlines, evidence, approvals | 8002 | `compliance` |
| `inspection-service` | Inspection scheduling, checklists, reports | 8003 | `inspection` |
| `violation-service` | Violations, corrective actions, escalations | 8004 | `violation` |
| `contractor-service` | Contractor profiles, contracts, scoring | 8005 | `contractor` |
| `report-service` | Report generation, templates, exports | 8006 | `report` |
| `notification-service` | Email, SMS, push, in-app notifications | 8007 | `notification` |
| `ai-engine` | ML models, risk scoring, anomaly detection | 8008 | `ai` |
| `gis-service` | Maps, geo-tagging, spatial queries | 8009 | `gis` |
| `ocr-service` | Document scanning, text extraction | 8010 | `ocr` |
| `production-service` | Production data, shift reports, equipment | 8011 | `production` |
| `gateway` | API routing, rate limiting, auth middleware | 8000 | — |

### 4.3 Communication Patterns
- **Synchronous**: REST APIs between frontend and gateway, gateway and services
- **Asynchronous**: RabbitMQ for inter-service events (e.g., violation created → notification service)
- **Cache**: Redis for session management, frequently accessed data (compliance deadlines, user permissions)
- **Search**: Elasticsearch for full-text search across inspections, violations, documents

### 4.4 Data Flow Example: Inspection Workflow

```
Field Officer (Mobile)
  │
  ├─ 1. Creates inspection (offline) → local SQLite
  │
  ├─ 2. Conducts inspection: fills checklist, takes geo-tagged photos
  │
  ├─ 3. Comes online → syncs to inspection-service
  │     │
  │     ├─ 3a. Photos uploaded to S3/MinIO
  │     ├─ 3b. Inspection record saved to PostgreSQL
  │     └─ 3c. Event published to RabbitMQ: "inspection.completed"
  │
  ├─ 4. violation-service consumes event
  │     ├─ 4a. Auto-creates violations from checklist failures
  │     └─ 4b. Publishes "violation.created" event
  │
  ├─ 5. notification-service consumes "violation.created"
  │     ├─ 5a. Sends email to Mine Manager
  │     ├─ 5b. Push notification to mobile
  │     └─ 5c. SMS if critical severity
  │
  ├─ 6. ai-engine consumes inspection data
  │     ├─ 6a. Updates risk score for mine area
  │     ├─ 6b. Checks for anomaly patterns
  │     └─ 6c. Publishes "risk.alert" if threshold exceeded
  │
  └─ 7. Dashboard updates in real-time via WebSocket
```

---

## 5. Tech Stack

### 5.1 Finalized Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend (Web)** | Next.js 14 (App Router) + TypeScript | SSR for SEO, RSC for performance, great DX |
| **Frontend (Mobile)** | React Native + Expo | Cross-platform, shared logic with web, offline support via WatermelonDB |
| **UI Components** | shadcn/ui + Tailwind CSS | Accessible, customizable, no vendor lock-in |
| **State Management** | Zustand (client) + TanStack Query (server) | Lightweight, TypeScript-native |
| **Charts/Viz** | Recharts + D3.js (custom) | Recharts for standard charts, D3 for GIS overlays |
| **Maps** | Leaflet + OpenStreetMap | Free, open-source, works offline with tile caching |
| **Backend** | Python FastAPI | Async, fast, auto-docs, great ML ecosystem |
| **ORM** | SQLAlchemy 2.0 + Alembic | Mature, async support, migration management |
| **API Gateway** | Kong (OSS) or AWS API Gateway | Rate limiting, auth, routing, monitoring |
| **Database** | PostgreSQL 16 + PostGIS | Robust, spatial queries, JSONB for flexible data |
| **Time-Series** | TimescaleDB (PostgreSQL extension) | Production metrics, sensor data, time-based queries |
| **Cache** | Redis 7 | Sessions, caching, rate limiting, pub/sub |
| **Message Queue** | RabbitMQ | Reliable async messaging between services |
| **Task Queue** | Celery + Redis (broker) | Background jobs: report generation, email, ML inference |
| **Search** | Elasticsearch 8 | Full-text search, log aggregation |
| **File Storage** | MinIO (dev) → AWS S3 (prod) | S3-compatible, photos, documents, reports |
| **OCR** | Tesseract + PaddleOCR | Free, multilingual, good accuracy on printed text |
| **ML Framework** | scikit-learn + XGBoost | Risk scoring, anomaly detection — no GPU needed |
| **NLP** | spaCy (free) → Claude API (paid, later) | Entity extraction from documents, multilingual |
| **Containerization** | Docker + Docker Compose | Consistent environments, easy local dev |
| **Orchestration** | AWS ECS Fargate (prod) | Serverless containers, no cluster management |
| **CI/CD** | GitHub Actions | Free for public repos, good Docker support |
| **Monitoring** | Prometheus + Grafana | Metrics, alerting, dashboards |
| **Logging** | ELK Stack (Elasticsearch + Logstash + Kibana) | Centralized logging, already have ES |
| **Error Tracking** | Sentry (free tier) | Error tracking, performance monitoring |
| **API Docs** | FastAPI auto-docs (Swagger/ReDoc) | Zero-effort API documentation |
| **Testing** | pytest (backend) + Jest + Playwright (frontend) | Industry standard, good coverage tools |

### 5.2 Open Source First → Paid Migration Path

| Function | Phase 1 (Free/OSS) | Phase 2 (Paid, when needed) |
|----------|--------------------|-----------------------------|
| NLP/Text Analysis | spaCy, Hugging Face transformers | Claude API / OpenAI |
| OCR | Tesseract + PaddleOCR | AWS Textract |
| Maps | Leaflet + OpenStreetMap | Mapbox / Google Maps |
| Email | SMTP (self-hosted) | AWS SES |
| SMS | — (in-app only) | MSG91 / Twilio |
| File Storage | MinIO (local) | AWS S3 |
| Search | Elasticsearch (self-hosted) | AWS OpenSearch |
| Monitoring | Prometheus + Grafana | AWS CloudWatch + Datadog |

---

## 6. Database Design

### 6.1 Schema Overview (PostgreSQL + PostGIS)

#### Auth Schema
```sql
-- auth.organizations (subsidiaries)
CREATE TABLE auth.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., "ECL", "BCCL", "CCL"
    type VARCHAR(50) NOT NULL, -- 'subsidiary', 'regulatory_body'
    address JSONB,
    contact JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- auth.mines
CREATE TABLE auth.mines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES auth.organizations(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'opencast', 'underground', 'mixed'
    location GEOGRAPHY(POINT, 4326), -- PostGIS
    boundary GEOGRAPHY(POLYGON, 4326), -- Mine boundary
    address JSONB,
    capacity_mtpa DECIMAL(10,2), -- Million Tonnes Per Annum
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB, -- flexible fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- auth.users
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(50),
    role VARCHAR(50) NOT NULL, -- FK to roles
    organization_id UUID REFERENCES auth.organizations(id),
    mine_id UUID REFERENCES auth.mines(id), -- NULL for org-level users
    designation VARCHAR(100),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    profile_photo_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- auth.roles
CREATE TABLE auth.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL, -- {"compliance.read": true, "compliance.write": true, ...}
    is_system BOOLEAN DEFAULT false, -- system roles can't be deleted
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- auth.sessions
CREATE TABLE auth.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Compliance Schema
```sql
-- compliance.categories
CREATE TABLE compliance.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- 'Safety', 'Environment', 'Labour', 'Production'
    parent_id UUID REFERENCES compliance.categories(id),
    regulation_reference VARCHAR(255), -- 'CMR 2017, Rule 45'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- compliance.items (statutory compliance requirements)
CREATE TABLE compliance.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES compliance.categories(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    regulation_reference VARCHAR(255),
    frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'annual', 'one_time'
    applicable_mine_types VARCHAR(50)[] DEFAULT '{opencast,underground,mixed}',
    severity VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    evidence_required BOOLEAN DEFAULT true,
    checklist_template JSONB, -- structured checklist items
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- compliance.tracking (per-mine compliance status)
CREATE TABLE compliance.tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES compliance.items(id),
    mine_id UUID REFERENCES auth.mines(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue', 'waived'
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    evidence_urls TEXT[], -- S3 paths
    checklist_responses JSONB,
    remarks TEXT,
    risk_score DECIMAL(5,2), -- AI-computed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(item_id, mine_id, period_start)
);

-- compliance.audit_log (immutable)
CREATE TABLE compliance.audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'approved', 'rejected'
    actor_id UUID NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    changes JSONB, -- {field: {old: x, new: y}}
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- No UPDATE or DELETE permissions on this table
```

#### Inspection Schema
```sql
-- inspection.templates
CREATE TABLE inspection.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'safety', 'environment', 'general', 'statutory'
    checklist JSONB NOT NULL, -- [{id, question, type, options, required, category}]
    applicable_mine_types VARCHAR(50)[],
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- inspection.inspections
CREATE TABLE inspection.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES inspection.templates(id),
    mine_id UUID REFERENCES auth.mines(id),
    inspector_id UUID REFERENCES auth.users(id),
    scheduled_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    location GEOGRAPHY(POINT, 4326),
    area_name VARCHAR(255),
    responses JSONB, -- checklist responses
    summary TEXT,
    overall_score DECIMAL(5,2),
    photos TEXT[], -- S3 paths
    signature_url VARCHAR(500),
    weather_conditions JSONB,
    sync_status VARCHAR(20) DEFAULT 'synced', -- 'pending', 'synced', 'conflict'
    offline_id VARCHAR(100), -- UUID generated on mobile for dedup
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Violation Schema
```sql
-- violation.violations
CREATE TABLE violation.violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID REFERENCES inspection.inspections(id),
    mine_id UUID REFERENCES auth.mines(id),
    reported_by UUID REFERENCES auth.users(id),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'critical', 'major', 'minor', 'observation'
    location GEOGRAPHY(POINT, 4326),
    area_name VARCHAR(255),
    photo_urls TEXT[],
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'assigned', 'in_progress', 'resolved', 'verified', 'closed'
    assigned_to UUID REFERENCES auth.users(id),
    due_date DATE,
    resolved_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    root_cause TEXT,
    regulation_reference VARCHAR(255),
    risk_score DECIMAL(5,2),
    escalation_level INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- violation.corrective_actions
CREATE TABLE violation.corrective_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_id UUID REFERENCES violation.violations(id),
    action_description TEXT NOT NULL,
    assigned_to UUID REFERENCES auth.users(id),
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    evidence_urls TEXT[],
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Contractor Schema
```sql
-- contractor.contractors
CREATE TABLE contractor.contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(15),
    address JSONB,
    license_details JSONB, -- {type, number, valid_from, valid_to, issuing_authority}
    insurance_details JSONB,
    safety_certifications JSONB,
    compliance_score DECIMAL(5,2) DEFAULT 0, -- AI-computed
    status VARCHAR(50) DEFAULT 'active',
    documents TEXT[], -- uploaded document S3 paths
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- contractor.contracts
CREATE TABLE contractor.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID REFERENCES contractor.contractors(id),
    mine_id UUID REFERENCES auth.mines(id),
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

-- contractor.worker_attendance
CREATE TABLE contractor.worker_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID REFERENCES contractor.contractors(id),
    mine_id UUID REFERENCES auth.mines(id),
    worker_name VARCHAR(200) NOT NULL,
    worker_id VARCHAR(100),
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    location GEOGRAPHY(POINT, 4326),
    within_geofence BOOLEAN,
    shift VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 Indexing Strategy
```sql
-- High-frequency query indexes
CREATE INDEX idx_compliance_tracking_mine_status ON compliance.tracking(mine_id, status);
CREATE INDEX idx_compliance_tracking_due_date ON compliance.tracking(due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_violations_mine_status ON violation.violations(mine_id, status);
CREATE INDEX idx_violations_severity ON violation.violations(severity, status);
CREATE INDEX idx_inspections_mine_date ON inspection.inspections(mine_id, scheduled_date);
CREATE INDEX idx_audit_log_entity ON compliance.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON compliance.audit_log(actor_id, created_at);

-- GIS indexes
CREATE INDEX idx_mines_location ON auth.mines USING GIST(location);
CREATE INDEX idx_violations_location ON violation.violations USING GIST(location);
CREATE INDEX idx_inspections_location ON inspection.inspections USING GIST(location);

-- Full-text search
CREATE INDEX idx_violations_search ON violation.violations USING GIN(to_tsvector('english', title || ' ' || description));
```

### 6.3 Data Partitioning Strategy
```sql
-- Partition audit_log by month (high-volume table)
CREATE TABLE compliance.audit_log (
    ...
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE compliance.audit_log_2026_01 PARTITION OF compliance.audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- ... auto-create via pg_partman extension

-- Partition worker_attendance by month
CREATE TABLE contractor.worker_attendance (
    ...
) PARTITION BY RANGE (date);
```

---

## 7. API Design

### 7.1 API Conventions
- **Base URL**: `/api/v1/{service}`
- **Auth**: JWT Bearer token in Authorization header
- **Format**: JSON request/response
- **Pagination**: Cursor-based for lists (`?cursor=xxx&limit=20`)
- **Filtering**: Query params (`?status=open&severity=critical&mine_id=xxx`)
- **Sorting**: `?sort=created_at&order=desc`
- **Errors**: RFC 7807 Problem Details format
- **Versioning**: URL path (`/api/v1/`, `/api/v2/`)

### 7.2 Core API Endpoints

#### Auth Service (`/api/v1/auth`)
```
POST   /register              - Register new user (admin only)
POST   /login                 - Login, returns JWT + refresh token
POST   /logout                - Invalidate session
POST   /refresh               - Refresh access token
GET    /me                    - Current user profile
PUT    /me                    - Update profile
POST   /forgot-password       - Request password reset
POST   /reset-password        - Reset password with token
GET    /users                 - List users (admin, paginated)
GET    /users/:id             - Get user details
PUT    /users/:id             - Update user (admin)
DELETE /users/:id             - Deactivate user (admin)
GET    /roles                 - List roles
POST   /roles                 - Create custom role (admin)
PUT    /roles/:id             - Update role permissions
GET    /organizations         - List organizations
GET    /mines                 - List mines (filtered by user's org)
POST   /mines                 - Create mine (admin)
PUT    /mines/:id             - Update mine
```

#### Compliance Service (`/api/v1/compliance`)
```
GET    /categories            - List compliance categories
POST   /categories            - Create category
GET    /items                 - List compliance items (filterable)
POST   /items                 - Create compliance item
GET    /items/:id             - Get item details
PUT    /items/:id             - Update item
GET    /tracking              - List tracking records (filterable by mine, status, date)
POST   /tracking              - Create tracking record
GET    /tracking/:id          - Get tracking details
PUT    /tracking/:id          - Update tracking (submit evidence, change status)
POST   /tracking/:id/approve  - Approve compliance submission
POST   /tracking/:id/reject   - Reject with remarks
GET    /tracking/overdue      - List overdue items
GET    /tracking/summary      - Compliance summary stats per mine
GET    /audit-log             - Query audit log (filterable)
```

#### Inspection Service (`/api/v1/inspections`)
```
GET    /templates             - List inspection templates
POST   /templates             - Create template
GET    /templates/:id         - Get template with checklist
PUT    /templates/:id         - Update template
GET    /                      - List inspections (filterable)
POST   /                      - Create/schedule inspection
GET    /:id                   - Get inspection details
PUT    /:id                   - Update inspection
POST   /:id/start             - Start inspection
POST   /:id/complete          - Complete inspection
POST   /:id/photos            - Upload inspection photos
POST   /sync                  - Bulk sync from mobile (offline data)
GET    /stats                 - Inspection statistics
```

#### Violation Service (`/api/v1/violations`)
```
GET    /                      - List violations (filterable)
POST   /                      - Report violation
GET    /:id                   - Get violation details
PUT    /:id                   - Update violation
POST   /:id/assign            - Assign to user
POST   /:id/resolve           - Mark resolved
POST   /:id/verify            - Verify resolution
POST   /:id/escalate          - Escalate violation
GET    /:id/actions            - List corrective actions
POST   /:id/actions            - Add corrective action
PUT    /:id/actions/:actionId  - Update corrective action
GET    /stats                  - Violation statistics
GET    /heatmap                - Geo-heatmap data
```

#### AI Engine (`/api/v1/ai`)
```
GET    /risk-scores            - Mine/area risk scores
GET    /risk-scores/:mine_id   - Detailed risk breakdown
POST   /risk-scores/compute    - Trigger risk score computation
GET    /anomalies              - Detected anomalies
GET    /predictions            - Compliance failure predictions
GET    /trends                 - Trend analysis
POST   /analyze-document       - OCR + entity extraction
```

#### Notification Service (`/api/v1/notifications`)
```
GET    /                       - User's notifications
PUT    /:id/read               - Mark as read
PUT    /read-all               - Mark all as read
GET    /preferences            - Notification preferences
PUT    /preferences            - Update preferences
WebSocket /ws                  - Real-time notification stream
```

### 7.3 Error Response Format
```json
{
    "type": "https://api.coalmine-gov.in/errors/validation-error",
    "title": "Validation Error",
    "status": 422,
    "detail": "The due_date must be in the future",
    "instance": "/api/v1/compliance/tracking",
    "errors": [
        {
            "field": "due_date",
            "message": "Must be a future date",
            "code": "FUTURE_DATE_REQUIRED"
        }
    ],
    "trace_id": "abc-123-def-456"
}
```

### 7.4 Rate Limiting
| Endpoint Pattern | Rate Limit | Window |
|-----------------|-----------|--------|
| `/api/v1/auth/login` | 5 requests | 1 minute |
| `/api/v1/auth/forgot-password` | 3 requests | 10 minutes |
| `/api/v1/*/` (GET) | 100 requests | 1 minute |
| `/api/v1/*/` (POST/PUT) | 30 requests | 1 minute |
| `/api/v1/ai/*` | 10 requests | 1 minute |
| `/api/v1/inspections/sync` | 5 requests | 1 minute |

---

## 8. Folder Structure

### 8.1 Monorepo Structure

```
coalmine-governance/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint + test on PR
│   │   ├── cd-staging.yml            # Deploy to staging on merge to develop
│   │   ├── cd-production.yml         # Deploy to prod on merge to main
│   │   └── codeql.yml                # Security scanning
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
│
├── apps/
│   ├── web/                          # Next.js web application
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages
│   │   │   │   ├── (auth)/           # Auth group: login, register, forgot-password
│   │   │   │   ├── (dashboard)/      # Dashboard group
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx      # Main dashboard
│   │   │   │   │   ├── compliance/
│   │   │   │   │   ├── inspections/
│   │   │   │   │   ├── violations/
│   │   │   │   │   ├── contractors/
│   │   │   │   │   ├── production/
│   │   │   │   │   ├── reports/
│   │   │   │   │   ├── maps/
│   │   │   │   │   ├── ai-insights/
│   │   │   │   │   ├── settings/
│   │   │   │   │   └── users/
│   │   │   │   └── api/              # Next.js API routes (BFF proxy)
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn components
│   │   │   │   ├── layout/           # Header, Sidebar, Footer
│   │   │   │   ├── dashboard/        # Dashboard widgets
│   │   │   │   ├── compliance/       # Compliance-specific components
│   │   │   │   ├── inspections/
│   │   │   │   ├── violations/
│   │   │   │   ├── maps/
│   │   │   │   ├── charts/
│   │   │   │   └── shared/           # Shared components
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   ├── api.ts            # API client
│   │   │   │   ├── auth.ts           # Auth utilities
│   │   │   │   ├── utils.ts
│   │   │   │   └── validators.ts
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── types/
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── mobile/                       # React Native (Expo)
│       ├── src/
│       │   ├── screens/
│       │   ├── components/
│       │   ├── navigation/
│       │   ├── services/
│       │   ├── stores/
│       │   ├── db/                    # WatermelonDB (offline)
│       │   └── utils/
│       ├── app.json
│       └── package.json
│
├── services/                         # Backend microservices
│   ├── gateway/                      # API Gateway
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── middleware/
│   │   │   │   ├── auth.py
│   │   │   │   ├── rate_limit.py
│   │   │   │   ├── cors.py
│   │   │   │   └── logging.py
│   │   │   └── routes/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── tests/
│   │
│   ├── auth-service/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── models/               # SQLAlchemy models
│   │   │   ├── schemas/              # Pydantic schemas
│   │   │   ├── api/                  # Route handlers
│   │   │   │   └── v1/
│   │   │   ├── services/             # Business logic
│   │   │   ├── repositories/         # Data access
│   │   │   └── utils/
│   │   ├── alembic/                  # DB migrations
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── compliance-service/           # Same structure as auth-service
│   ├── inspection-service/
│   ├── violation-service/
│   ├── contractor-service/
│   ├── report-service/
│   ├── notification-service/
│   ├── ai-engine/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── models/               # ML model definitions
│   │   │   ├── training/             # Training scripts
│   │   │   ├── inference/            # Inference endpoints
│   │   │   ├── data/                 # Data processing
│   │   │   └── utils/
│   │   ├── notebooks/                # Jupyter notebooks for exploration
│   │   ├── model_artifacts/          # Saved models (.joblib, .pkl)
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── gis-service/
│   └── ocr-service/
│
├── packages/                         # Shared packages
│   ├── shared-types/                 # Shared TypeScript types
│   ├── shared-utils/                 # Shared Python utilities
│   └── db-migrations/                # Centralized DB migrations
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml        # Local dev
│   │   ├── docker-compose.prod.yml
│   │   └── docker-compose.test.yml
│   ├── aws/
│   │   ├── cloudformation/           # or Terraform
│   │   │   ├── vpc.yml
│   │   │   ├── ecs.yml
│   │   │   ├── rds.yml
│   │   │   ├── s3.yml
│   │   │   ├── elasticache.yml
│   │   │   └── alb.yml
│   │   └── scripts/
│   ├── nginx/
│   │   └── nginx.conf
│   └── monitoring/
│       ├── prometheus.yml
│       ├── grafana/
│       │   └── dashboards/
│       └── alertmanager.yml
│
├── docs/
│   ├── architecture/
│   │   ├── system-overview.md
│   │   ├── data-flow.md
│   │   └── decisions/                # ADRs (Architecture Decision Records)
│   ├── api/
│   │   └── postman-collection.json
│   ├── deployment/
│   │   ├── aws-setup.md
│   │   └── runbook.md
│   └── user-guide/
│
├── scripts/
│   ├── setup.sh                      # One-command project setup
│   ├── seed-data.py                  # Generate demo/synthetic data
│   ├── generate-reports.py
│   └── migrate.sh
│
├── .env.example
├── .gitignore
├── docker-compose.yml → infrastructure/docker/docker-compose.yml
├── Makefile                          # make dev, make test, make deploy
└── README.md
```

---

## 9. ML/AI Models

### 9.1 Model Inventory

| Model | Algorithm | Input | Output | Training Data |
|-------|-----------|-------|--------|---------------|
| Mine Risk Scorer | XGBoost Regressor | Violation count, severity distribution, compliance rate, inspection scores, historical incidents | Risk score 0-100 | Historical mine data (synthetic initially) |
| Compliance Failure Predictor | Random Forest Classifier | Compliance history, deadlines, seasonal patterns, resource allocation | Probability of failure (0-1) | Past compliance tracking records |
| Anomaly Detector | Isolation Forest | Production metrics, attendance patterns, environmental readings | Anomaly flag + severity | Time-series operational data |
| Violation Severity Classifier | SVM / Logistic Regression | Violation text description, category, location | Severity: critical/major/minor | Labeled violation dataset |
| Document Entity Extractor | spaCy NER (custom trained) | OCR text from scanned documents | Entities: dates, regulation references, mine names, measurements | Annotated compliance documents |

### 9.2 ML System Requirements
- **No GPU required** — all models are traditional ML (scikit-learn, XGBoost), no deep learning
- **Training**: Can run on any machine with 4GB RAM, takes < 5 minutes
- **Inference**: < 100ms per prediction, runs in FastAPI endpoint
- **Model storage**: `.joblib` files in S3, loaded into memory on service start
- **Retraining**: Scheduled weekly via Celery beat task
- **Monitoring**: Track prediction accuracy, data drift via custom metrics

### 9.3 Algorithm Selection Rationale

| Problem | Chosen Algorithm | Why Not Alternatives |
|---------|-----------------|---------------------|
| Risk scoring | XGBoost | Handles missing features, no feature scaling needed, interpretable via SHAP. Not neural net — data too small. |
| Failure prediction | Random Forest | Robust to overfitting with small datasets, handles categorical features. Not logistic regression — too many non-linear interactions. |
| Anomaly detection | Isolation Forest | Works well with high-dimensional data, no labeled anomalies needed. Not autoencoders — overkill, needs GPU. |
| Text classification | SVM | Works well with small labeled datasets, TF-IDF features sufficient. Not transformers — data too small, resource heavy. |

### 9.4 Data Pipeline
```
Raw Data → Celery Task (daily) → Feature Engineering → Model Training → Model Registry (S3)
                                                                            │
Inference Request → Load Model from Memory → Predict → Return Score → Cache in Redis (TTL: 1hr)
```

---

## 10. UI/UX Design Plan

### 10.1 Design System

- **Color Palette**: Industrial/governance theme — navy blue primary (#1e3a5f), orange accent (#e67e22) for warnings, green (#27ae60) for compliant, red (#e74c3c) for violations
- **Typography**: Inter (system) — clean, professional, highly legible
- **Component Library**: shadcn/ui — accessible, customizable
- **Icons**: Lucide Icons (consistent, lightweight)
- **Layout**: Sidebar navigation (collapsible), top bar with user info + notifications
- **Responsive**: Desktop-first (dashboard usage), mobile-responsive

### 10.2 Page Map

```
Login ─────────────────────────────────────────────────────────
  │
  ├── Dashboard (role-specific) ──────────────────────────────
  │     ├── KPI Cards (compliance rate, violations, inspections)
  │     ├── Compliance Status Chart (donut)
  │     ├── Recent Violations (table)
  │     ├── Upcoming Deadlines (list)
  │     ├── Mine Risk Heatmap (map widget)
  │     └── AI Alerts (notification cards)
  │
  ├── Compliance ─────────────────────────────────────────────
  │     ├── List View (filterable table)
  │     ├── Calendar View (deadlines)
  │     ├── Detail View (status, evidence, history)
  │     └── Approval Queue
  │
  ├── Inspections ────────────────────────────────────────────
  │     ├── Schedule View (calendar)
  │     ├── List View (all inspections)
  │     ├── Conduct Inspection (wizard/stepper)
  │     └── Inspection Report (printable)
  │
  ├── Violations ─────────────────────────────────────────────
  │     ├── List View (filterable, sortable)
  │     ├── Detail View (timeline, corrective actions)
  │     ├── Heatmap View (geo)
  │     └── Analytics (trends, by category)
  │
  ├── Contractors ────────────────────────────────────────────
  │     ├── List View
  │     ├── Profile View (score, contracts, workers)
  │     ├── Contract Management
  │     └── Worker Attendance
  │
  ├── Production ─────────────────────────────────────────────
  │     ├── Daily Reports
  │     ├── Shift-wise Data
  │     └── Equipment Utilization
  │
  ├── Reports ────────────────────────────────────────────────
  │     ├── Report Templates
  │     ├── Generated Reports
  │     └── Custom Report Builder
  │
  ├── Maps (GIS) ─────────────────────────────────────────────
  │     ├── Mine Overview Map
  │     ├── Incident Heatmap
  │     └── Inspection Coverage
  │
  ├── AI Insights ────────────────────────────────────────────
  │     ├── Risk Dashboard
  │     ├── Predictions
  │     ├── Anomaly Alerts
  │     └── Trend Analysis
  │
  ├── Notifications ──────────────────────────────────────────
  │     └── Notification Center
  │
  └── Settings ───────────────────────────────────────────────
        ├── User Management
        ├── Role Management
        ├── Mine Configuration
        ├── Notification Preferences
        └── System Settings
```

### 10.3 Mobile App Screens (React Native)

```
Login → Dashboard (simplified)
  ├── Quick Actions (FAB)
  │     ├── Report Incident
  │     ├── Start Inspection
  │     ├── Mark Attendance
  │     └── File Grievance
  ├── Inspections (offline-capable)
  │     ├── My Inspections
  │     ├── Conduct Inspection (camera, GPS, checklist)
  │     └── Sync Status
  ├── Violations
  │     ├── Report Violation (camera, GPS)
  │     └── My Assigned Actions
  ├── Attendance (geo-fenced check-in/out)
  ├── Notifications
  └── Profile & Offline Settings
```

---

## 11. Development Roadmap

### 11.1 Phase Overview

| Phase | Duration | Focus | Deliverable |
|-------|----------|-------|-------------|
| Phase 0 | Week 1 | Setup & Architecture | Dev environment, CI/CD, DB schema, project scaffolding |
| Phase 1 | Weeks 2-4 | Core Platform | Auth, RBAC, Compliance CRUD, basic dashboard |
| Phase 2 | Weeks 5-7 | Inspections & Violations | Inspection workflow, violation management, notifications |
| Phase 3 | Weeks 8-10 | AI & Advanced Features | ML models, risk scoring, GIS maps, reports |
| Phase 4 | Weeks 11-12 | Mobile App | React Native app, offline sync |
| Phase 5 | Weeks 13-14 | Polish & Production | Contractors, production module, testing, optimization |
| Phase 6 | Week 15-16 | Deployment & Launch | AWS deployment, load testing, documentation |

### 11.2 Phase 0: Setup & Architecture (Week 1)

**Tasks:**
- [ ] Initialize monorepo structure
- [ ] Set up Docker Compose (PostgreSQL, Redis, RabbitMQ, MinIO, Elasticsearch)
- [ ] Create FastAPI service template with standard structure
- [ ] Set up Next.js app with shadcn/ui, Tailwind, auth pages
- [ ] Create all database schemas and run initial migrations
- [ ] Set up GitHub repo, branch protection, CI pipeline
- [ ] Write Makefile with dev commands
- [ ] Create `.env.example` with all required variables
- [ ] Set up Sentry error tracking
- [ ] Create seed data script

**Verification Checklist:**
- [ ] `make dev` starts all services
- [ ] Database schemas created and migrations pass
- [ ] CI pipeline runs lint + tests on PR
- [ ] All services return health check on their ports
- [ ] Next.js app loads at localhost:3000
- [ ] API docs available at localhost:8000/docs

### 11.3 Phase 1: Core Platform (Weeks 2-4)

**Sprint 1 (Week 2): Auth + User Management**
- [ ] Auth service: register, login, logout, JWT, refresh tokens
- [ ] Password hashing (bcrypt), password reset flow
- [ ] RBAC middleware — permission checking
- [ ] User CRUD (admin)
- [ ] Organization & Mine CRUD
- [ ] Frontend: Login page, registration, forgot password
- [ ] Frontend: User management page (admin)
- [ ] Frontend: Dashboard layout (sidebar, header, routing)

**Sprint 2 (Week 3): Compliance Module**
- [ ] Compliance categories CRUD
- [ ] Compliance items CRUD with templates
- [ ] Compliance tracking: create, update, submit evidence
- [ ] Approval workflow: submit → review → approve/reject
- [ ] Overdue detection (Celery periodic task)
- [ ] Frontend: Compliance list view with filters
- [ ] Frontend: Compliance detail view with evidence upload
- [ ] Frontend: Approval queue

**Sprint 3 (Week 4): Dashboard + Foundation**
- [ ] Dashboard API: aggregated stats per mine
- [ ] Frontend: Dashboard with KPI cards
- [ ] Frontend: Compliance status donut chart
- [ ] Frontend: Upcoming deadlines widget
- [ ] Frontend: Recent activity feed
- [ ] Audit log middleware (auto-log all state changes)
- [ ] Pagination, filtering, sorting on all list endpoints
- [ ] Redis caching for dashboard stats (TTL: 5 min)

**Phase 1 Verification:**
- [ ] Can register users, login, get JWT
- [ ] RBAC blocks unauthorized access (test with different roles)
- [ ] Compliance items created, tracked, evidence uploaded
- [ ] Approval workflow works end-to-end
- [ ] Dashboard shows real data
- [ ] Overdue items detected and flagged
- [ ] Audit log records all actions
- [ ] All API endpoints documented in Swagger

### 11.4 Phase 2: Inspections & Violations (Weeks 5-7)

**Sprint 4 (Week 5): Inspection Management**
- [ ] Inspection templates CRUD
- [ ] Inspection scheduling and assignment
- [ ] Inspection conduct flow (checklist responses, photo upload to S3)
- [ ] Inspection completion and scoring
- [ ] Frontend: Inspection schedule calendar
- [ ] Frontend: Conduct inspection wizard (multi-step form)
- [ ] Frontend: Inspection report view

**Sprint 5 (Week 6): Violation Management**
- [ ] Violation CRUD with photo upload
- [ ] Auto-violation creation from failed inspection items
- [ ] Corrective action management
- [ ] Violation status workflow (open → assigned → resolved → verified)
- [ ] Escalation logic (Celery: overdue violations escalate)
- [ ] Frontend: Violation list with severity color-coding
- [ ] Frontend: Violation detail with timeline
- [ ] Frontend: Corrective action tracking

**Sprint 6 (Week 7): Notifications + Integration**
- [ ] Notification service: in-app, email (SMTP)
- [ ] Event-driven notifications (RabbitMQ consumers)
- [ ] WebSocket for real-time notifications
- [ ] Notification preferences per user
- [ ] Frontend: Notification bell with dropdown
- [ ] Frontend: Notification center page
- [ ] Integration: Inspection → Violation → Notification flow

**Phase 2 Verification:**
- [ ] Full inspection lifecycle: schedule → conduct → report → auto-violations
- [ ] Violations tracked from creation to verified closure
- [ ] Escalation fires when violations are overdue
- [ ] Notifications sent on key events (email + in-app)
- [ ] WebSocket delivers real-time updates
- [ ] Photos uploaded to S3 and displayed correctly
- [ ] Cross-service communication via RabbitMQ works

### 11.5 Phase 3: AI & Advanced Features (Weeks 8-10)

**Sprint 7 (Week 8): AI/ML Engine**
- [ ] Generate synthetic training data (Python script)
- [ ] Train Mine Risk Scorer (XGBoost)
- [ ] Train Compliance Failure Predictor (Random Forest)
- [ ] Train Anomaly Detector (Isolation Forest)
- [ ] Risk scoring API endpoints
- [ ] Celery task: daily risk score recomputation
- [ ] Model versioning and storage in S3
- [ ] Frontend: AI Insights dashboard
- [ ] Frontend: Risk score visualization per mine

**Sprint 8 (Week 9): GIS + Maps**
- [ ] GIS service: spatial queries with PostGIS
- [ ] Leaflet map integration in frontend
- [ ] Mine locations on map
- [ ] Violation heat map overlay
- [ ] Inspection coverage map
- [ ] Geo-tagged incident markers
- [ ] Frontend: Maps page with layer controls

**Sprint 9 (Week 10): Reports + OCR**
- [ ] Report service: template-based PDF generation (WeasyPrint)
- [ ] Statutory report templates (compliance summary, inspection report)
- [ ] Custom report builder (select metrics, date range, mines)
- [ ] Excel export
- [ ] OCR service: Tesseract integration for document scanning
- [ ] Frontend: Reports page with generation and download
- [ ] Frontend: Document upload and OCR results

**Phase 3 Verification:**
- [ ] ML models trained, inference returns reasonable scores
- [ ] Risk scores update daily via Celery
- [ ] Map displays mines, violations, inspections correctly
- [ ] Heat map renders with real violation data
- [ ] PDF reports generate with correct data
- [ ] OCR extracts text from sample documents
- [ ] AI insights dashboard shows predictions and anomalies

### 11.6 Phase 4: Mobile App (Weeks 11-12)

**Sprint 10 (Week 11): Mobile Core**
- [ ] React Native (Expo) project setup
- [ ] Login and auth flow (JWT storage in SecureStore)
- [ ] Dashboard screen (simplified)
- [ ] WatermelonDB setup for offline storage
- [ ] Offline-first architecture: local-first, sync when online

**Sprint 11 (Week 12): Mobile Features**
- [ ] Conduct inspection (offline): checklist, camera, GPS
- [ ] Report violation (offline): photo, GPS, description
- [ ] Worker attendance with geo-fencing
- [ ] Sync engine: conflict resolution, background sync
- [ ] Push notifications (Expo Push)
- [ ] Offline indicator UI

**Phase 4 Verification:**
- [ ] Mobile login works
- [ ] Inspection conducted fully offline
- [ ] Data syncs correctly when coming online
- [ ] GPS coordinates captured accurately
- [ ] Photos compressed and uploaded
- [ ] Push notifications received
- [ ] Works on Android 8+ with 2GB RAM

### 11.7 Phase 5: Polish & Production (Weeks 13-14)

**Sprint 12 (Week 13): Remaining Modules**
- [ ] Contractor management (CRUD, scoring, contracts)
- [ ] Production reporting (daily reports, shift data)
- [ ] Grievance management
- [ ] Worker attendance module (web)
- [ ] Multilingual support (i18n framework, Hindi translations)

**Sprint 13 (Week 14): Testing & Optimization**
- [ ] Write unit tests (80% coverage target)
- [ ] Integration tests for all API flows
- [ ] E2E tests for critical paths (Playwright)
- [ ] Performance optimization (query analysis, caching)
- [ ] Security audit (OWASP checklist)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Load testing (k6 or Locust)

**Phase 5 Verification:**
- [ ] All modules functional and tested
- [ ] 80% code coverage
- [ ] E2E tests pass for: login → dashboard → create compliance → inspect → report violation → resolve
- [ ] Response times < 200ms for API, < 2s for pages
- [ ] No critical/high security vulnerabilities
- [ ] Load test: 500 concurrent users, no failures

### 11.8 Phase 6: Deployment & Launch (Weeks 15-16)

**Sprint 14 (Week 15): AWS Deployment**
- [ ] VPC setup (public + private subnets)
- [ ] RDS PostgreSQL (Multi-AZ)
- [ ] ElastiCache Redis
- [ ] S3 buckets (photos, documents, ML models)
- [ ] ECS Fargate cluster with service definitions
- [ ] ALB with SSL certificate (ACM)
- [ ] Route 53 DNS
- [ ] CloudWatch logging and alarms
- [ ] CI/CD: GitHub Actions → ECR → ECS deploy

**Sprint 15 (Week 16): Launch**
- [ ] Production data seeding (demo data)
- [ ] User acceptance testing
- [ ] Performance monitoring setup (Grafana dashboards)
- [ ] Runbook documentation
- [ ] Final security review
- [ ] Go-live checklist
- [ ] Post-launch monitoring (48-hour watch)

**Phase 6 Verification:**
- [ ] All services healthy on AWS
- [ ] SSL certificate valid and enforced
- [ ] Database backups configured (daily, 7-day retention)
- [ ] Monitoring alerts configured
- [ ] Rollback procedure tested
- [ ] Domain resolves correctly
- [ ] Production load test passes

---

## 12. Team Division (3 Members)

### 12.1 Role Assignment

| Member | Role | Primary Responsibility | Secondary |
|--------|------|----------------------|-----------|
| **Member A** | Full-Stack Lead (Frontend-heavy) | Next.js web app, UI/UX, dashboards, charts, maps | React Native mobile app |
| **Member B** | Backend Lead | FastAPI services (auth, compliance, inspection, violation, contractor, production), DB design, API design | DevOps, Docker, CI/CD |
| **Member C** | AI/ML + Backend | AI engine, ML models, notification service, report service, OCR service, GIS service | Data pipeline, Celery tasks |

### 12.2 Work Distribution by Phase

| Phase | Member A | Member B | Member C |
|-------|----------|----------|----------|
| Phase 0 | Next.js scaffold, shadcn/ui setup, auth pages | Monorepo, Docker Compose, DB schemas, FastAPI template | RabbitMQ, Celery, S3/MinIO setup, seed data script |
| Phase 1 | Login/register UI, dashboard layout, compliance pages | Auth service, compliance service, RBAC, audit log | Notification service skeleton, Elasticsearch setup |
| Phase 2 | Inspection wizard, violation pages, notification UI | Inspection service, violation service, escalation logic | Notification service (email, WebSocket, RabbitMQ consumers) |
| Phase 3 | Maps page (Leaflet), AI insights dashboard, report UI | Report service (PDF gen), API optimization, caching | AI engine (train models, inference API), OCR service, GIS service |
| Phase 4 | React Native app (all screens) | Mobile API endpoints, sync endpoint, offline conflict resolution | Push notification setup, background sync optimization |
| Phase 5 | Contractor UI, production UI, i18n, accessibility | Contractor service, production service, unit tests | Integration tests, load testing, ML model retraining pipeline |
| Phase 6 | User guide, demo data, UAT | AWS infrastructure, CI/CD, deployment | Monitoring (Prometheus + Grafana), alerting, runbook |

### 12.3 Code Ownership (CODEOWNERS)
```
# .github/CODEOWNERS
apps/web/                   @member-a
apps/mobile/                @member-a
services/auth-service/      @member-b
services/compliance-service/ @member-b
services/inspection-service/ @member-b
services/violation-service/  @member-b
services/contractor-service/ @member-b
services/production-service/ @member-b
services/gateway/            @member-b
services/ai-engine/          @member-c
services/notification-service/ @member-c
services/report-service/     @member-c
services/gis-service/        @member-c
services/ocr-service/        @member-c
infrastructure/              @member-b
packages/                    @member-b @member-c
```

---

## 13. Git Workflow & Commit Strategy

### 13.1 Branch Strategy (Git Flow, simplified)

```
main (production)
  └── develop (integration)
        ├── feature/auth-service        (Member B)
        ├── feature/compliance-ui       (Member A)
        ├── feature/ai-risk-scorer      (Member C)
        ├── feature/inspection-wizard   (Member A)
        ├── fix/login-redirect          (any)
        └── hotfix/critical-auth-bug    (→ main + develop)
```

**Rules:**
- `main`: Production-ready. Protected. Merge via PR with 1 approval.
- `develop`: Integration branch. All features merge here first.
- `feature/*`: One per task/ticket. Named `feature/{module}-{short-description}`.
- `fix/*`: Bug fixes.
- `hotfix/*`: Critical production fixes — merge to both `main` and `develop`.

### 13.2 Commit Convention (Conventional Commits)

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore, ci, perf
Scope: auth, compliance, inspection, violation, web, mobile, ai, infra

Examples:
feat(auth): add JWT refresh token rotation
fix(compliance): correct overdue deadline calculation
feat(web): implement compliance list view with filters
test(inspection): add unit tests for scoring logic
chore(infra): update Docker Compose with Elasticsearch
perf(api): add Redis caching to dashboard stats
```

### 13.3 PR Process
1. Create branch from `develop`
2. Write code, commit with conventional commits
3. Push branch, create PR
4. CI runs (lint + tests)
5. Code review by 1 team member (CODEOWNERS auto-assigns)
6. Address review comments
7. Squash merge into `develop`
8. Delete feature branch

### 13.4 Release Process
1. Create PR from `develop` to `main`
2. All 3 members review
3. Run full test suite + e2e tests
4. Merge (no squash — preserve history)
5. Tag release: `v1.0.0`, `v1.1.0`, etc.
6. CD pipeline deploys to production

---

## 14. Testing Strategy

### 14.1 Testing Pyramid

```
         ╱  E2E Tests  ╲           ← 10% — Critical user flows
        ╱────────────────╲
       ╱ Integration Tests ╲       ← 30% — API + DB + service interaction
      ╱──────────────────────╲
     ╱      Unit Tests        ╲    ← 60% — Business logic, utilities
    ╱──────────────────────────╲
```

### 14.2 Backend Testing (pytest)

**Unit Tests:**
```python
# tests/unit/test_compliance_service.py
class TestComplianceService:
    def test_create_tracking_with_valid_data(self):
        ...
    def test_detect_overdue_items(self):
        ...
    def test_calculate_compliance_rate(self):
        ...
    def test_reject_future_period_start(self):
        ...
```

**Integration Tests:**
```python
# tests/integration/test_compliance_api.py
class TestComplianceAPI:
    def test_create_tracking_returns_201(self, client, auth_headers):
        ...
    def test_unauthorized_user_gets_403(self, client):
        ...
    def test_approve_compliance_updates_status(self, client, admin_headers):
        ...
    def test_overdue_items_trigger_notification(self, client, mock_rabbitmq):
        ...
```

**Test Infrastructure:**
- `conftest.py` with fixtures: test DB, test client, auth tokens per role
- `factories.py` using `factory_boy` for test data generation
- Docker test database (separate container)

### 14.3 Frontend Testing (Jest + Playwright)

**Unit Tests (Jest + React Testing Library):**
```typescript
// __tests__/components/ComplianceTable.test.tsx
describe('ComplianceTable', () => {
  it('renders compliance items', () => { ... });
  it('filters by status', () => { ... });
  it('shows overdue badge for overdue items', () => { ... });
  it('disables approve button for non-managers', () => { ... });
});
```

**E2E Tests (Playwright):**
```typescript
// e2e/compliance-flow.spec.ts
test('complete compliance workflow', async ({ page }) => {
  await loginAs(page, 'mine_manager');
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="kpi-compliance-rate"]')).toBeVisible();
  // Navigate to compliance
  await page.click('[data-testid="nav-compliance"]');
  // Create tracking
  await page.click('[data-testid="btn-add-tracking"]');
  // Fill form...
  // Submit evidence...
  // Approve...
  await expect(page.locator('[data-testid="status-badge"]')).toHaveText('Completed');
});
```

### 14.4 Test Coverage Targets

| Module | Unit | Integration | E2E | Overall Target |
|--------|------|-------------|-----|----------------|
| Auth | 90% | 80% | Login/Register | 85% |
| Compliance | 85% | 80% | Full workflow | 80% |
| Inspection | 85% | 75% | Conduct + Report | 80% |
| Violation | 85% | 75% | Report + Resolve | 80% |
| AI Engine | 80% | 70% | — | 75% |
| Frontend | 70% | — | Critical flows | 70% |

### 14.5 Testing Schedule

| Type | When | Who |
|------|------|-----|
| Unit tests | Every commit (CI) | Developer who wrote the code |
| Integration tests | Every PR (CI) | CI pipeline |
| E2E tests | Daily (CI, scheduled) | CI pipeline |
| Load testing | End of Phase 5, pre-deploy | Member C |
| Security testing | End of Phase 5 | All members |
| Alpha testing | End of Phase 5 | Team + 2-3 testers |
| Beta testing | Phase 6 (Week 15) | 10-15 target users |
| UAT | Phase 6 (Week 16) | Stakeholders/faculty |

### 14.6 Alpha & Beta Testing Plan

**Alpha (Internal):**
- Team members test all features manually
- 2-3 external testers (classmates) use the system
- Focus: functionality, critical bugs, UX issues
- Duration: 3 days
- Checklist: Every page tested, every CRUD operation, every role

**Beta (External):**
- 10-15 users (faculty, domain experts if available)
- Real-ish scenarios: create mine, track compliance, conduct inspection
- Feedback form: ease of use, missing features, bugs
- Duration: 5 days
- Fix critical bugs, deprioritize cosmetic issues

---

## 15. Security Plan

### 15.1 Authentication & Authorization
- [x] JWT with short-lived access tokens (15 min) + long-lived refresh tokens (7 days)
- [x] Refresh token rotation (one-time use)
- [x] Password hashing: bcrypt with salt rounds = 12
- [x] Password policy: min 8 chars, 1 uppercase, 1 number, 1 special
- [x] Account lockout after 5 failed attempts (15 min cooldown)
- [x] RBAC with permission-based middleware on every endpoint
- [x] Session management: revoke all sessions on password change

### 15.2 Data Security
- [x] HTTPS everywhere (TLS 1.3)
- [x] Database encryption at rest (AWS RDS encryption)
- [x] Sensitive fields encrypted in DB (phone, address) — application-level AES-256
- [x] S3 bucket: private, pre-signed URLs for access (1-hour expiry)
- [x] Environment variables for secrets (never in code)
- [x] No secrets in git (`.gitignore`, `git-secrets` hook)

### 15.3 API Security
- [x] Rate limiting (see Section 7.4)
- [x] Input validation on all endpoints (Pydantic schemas)
- [x] SQL injection prevention (SQLAlchemy ORM — parameterized queries)
- [x] XSS prevention (React auto-escapes, CSP headers)
- [x] CSRF protection (SameSite cookies + CSRF tokens for forms)
- [x] CORS whitelist (only known frontend origins)
- [x] File upload validation (type, size, content-type header)
- [x] Request size limits (10MB body max)
- [x] Security headers: HSTS, X-Content-Type-Options, X-Frame-Options

### 15.4 Audit & Compliance
- [x] Immutable audit log (no UPDATE/DELETE on audit table)
- [x] All user actions logged with timestamp, IP, user agent
- [x] Database-level row-level security where applicable
- [x] Regular dependency vulnerability scanning (Dependabot, Safety)
- [x] SAST scanning (CodeQL in CI)

---

## 16. DevOps & Deployment

### 16.1 Local Development

```yaml
# docker-compose.yml (simplified)
services:
  postgres:
    image: postgis/postgis:16-3.4
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

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

  elasticsearch:
    image: elasticsearch:8.12.0
    ports: ["9200:9200"]
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
```

### 16.2 AWS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VPC                                  │
│                                                              │
│  ┌──────────────── Public Subnets ────────────────────┐     │
│  │  ALB (Application Load Balancer)                    │     │
│  │  NAT Gateway                                        │     │
│  └─────────────────────┬──────────────────────────────┘     │
│                         │                                    │
│  ┌──────────────── Private Subnets ───────────────────┐     │
│  │                                                     │     │
│  │  ECS Fargate Cluster                                │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ │     │
│  │  │ Auth    │ │ Comply  │ │ Inspect │ │ Violate  │ │     │
│  │  │ Service │ │ Service │ │ Service │ │ Service  │ │     │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────┘ │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐ │     │
│  │  │ Notif.  │ │ Report  │ │ AI      │ │ GIS      │ │     │
│  │  │ Service │ │ Service │ │ Engine  │ │ Service  │ │     │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────┘ │     │
│  │                                                     │     │
│  │  RDS PostgreSQL (Multi-AZ)                          │     │
│  │  ElastiCache Redis (Cluster)                        │     │
│  │  Amazon MQ (RabbitMQ)                               │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  S3 (files, ML models, static assets)                        │
│  CloudFront (CDN for web app)                                │
│  CloudWatch (logs, metrics, alarms)                          │
│  SES (email)                                                 │
│  ECR (container registry)                                    │
└─────────────────────────────────────────────────────────────┘
```

### 16.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
on:
  pull_request:
    branches: [develop, main]

jobs:
  lint-and-test-backend:
    runs-on: ubuntu-latest
    services:
      postgres: ...
      redis: ...
    steps:
      - checkout
      - setup-python
      - install deps
      - ruff check (linting)
      - ruff format --check
      - pytest --cov=app --cov-report=xml
      - upload coverage

  lint-and-test-frontend:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node
      - npm ci
      - eslint
      - tsc --noEmit
      - jest --coverage
      - playwright (e2e)

  security:
    runs-on: ubuntu-latest
    steps:
      - CodeQL analysis
      - pip-audit / npm audit
```

```yaml
# .github/workflows/cd-staging.yml
on:
  push:
    branches: [develop]

jobs:
  build-and-deploy:
    steps:
      - Build Docker images
      - Push to ECR
      - Update ECS task definitions
      - Deploy to ECS (rolling update)
      - Run smoke tests
      - Notify Slack/Discord
```

### 16.4 Docker Strategy

Each service gets a multi-stage Dockerfile:
```dockerfile
# services/auth-service/Dockerfile
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

---

## 17. Performance & Optimization

### 17.1 Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|------|---------------|-----|-------------|
| Dashboard stats | Redis | 5 min | On new compliance/violation/inspection event |
| User permissions | Redis | 15 min | On role/permission update |
| Compliance item list | Redis | 1 hour | On CRUD operation |
| Risk scores | Redis | 1 hour | On daily recomputation |
| Mine list | Redis | 1 hour | On mine CRUD |
| Static reference data | Redis | 24 hours | Manual invalidation |
| API responses (GET) | HTTP Cache-Control | 60s | ETag-based |

### 17.2 Database Optimization
- Connection pooling: SQLAlchemy async pool (10-20 connections per service)
- Read replicas for reporting queries (RDS)
- Materialized views for dashboard aggregations (refresh every 5 min)
- Partial indexes for active-only queries
- EXPLAIN ANALYZE on all queries during development
- pg_stat_statements monitoring

### 17.3 Frontend Optimization
- Next.js ISR (Incremental Static Regeneration) for semi-static pages
- React Server Components for data-heavy pages (dashboards)
- Image optimization (next/image, WebP)
- Code splitting per route
- Lazy-load heavy components (maps, charts)
- Debounce search inputs (300ms)
- Virtual scrolling for large tables (TanStack Virtual)
- Service Worker for offline web support (future)

### 17.4 API Optimization
- Response compression (gzip/brotli)
- Select only needed fields (no `SELECT *`)
- Batch operations where possible
- Background processing for heavy operations (Celery)
- Request deduplication middleware
- ETags for conditional requests

---

## 18. Phase Verification Checklists

### After Each Phase, Run This Checklist:

#### Universal Checks (Every Phase)
- [ ] All new endpoints have OpenAPI docs
- [ ] All new endpoints have input validation
- [ ] All state changes logged in audit_log
- [ ] No hardcoded secrets in code
- [ ] No `console.log` / `print` debug statements
- [ ] All new DB tables have indexes on FK and filter columns
- [ ] Error responses follow RFC 7807 format
- [ ] RBAC tested for each new endpoint (positive + negative)
- [ ] Docker Compose still works (`make dev`)
- [ ] CI pipeline passes
- [ ] README updated if setup steps changed

#### Phase Transition Process
```
1. Code freeze on feature branches
2. Merge all feature branches to develop
3. Run full test suite
4. Fix any failures
5. Team demo (15-min walkthrough)
6. Document what's done, what's deferred
7. Update roadmap if needed
8. Tag release: v0.{phase}.0
9. Deploy to staging
10. Quick smoke test
11. Start next phase
```

---

## 19. Page-Level Feature Checklists

### Login Page
- [ ] Email + password form with validation
- [ ] Show/hide password toggle
- [ ] "Forgot password" link
- [ ] Error messages for invalid credentials
- [ ] Account lockout message after 5 attempts
- [ ] Redirect to dashboard on success
- [ ] Remember me (extend session)
- [ ] Loading state on submit
- [ ] Responsive (mobile-friendly)

### Dashboard
- [ ] KPI cards: compliance rate, open violations, inspections this month, overdue items
- [ ] Compliance status donut chart (by category)
- [ ] Recent violations table (top 5, severity color-coded)
- [ ] Upcoming deadlines list (next 7 days)
- [ ] Mine risk score overview (mini map or bars)
- [ ] AI alerts section (top 3 predictions/anomalies)
- [ ] Quick action buttons (new inspection, report violation)
- [ ] Date range filter (last 7/30/90 days)
- [ ] Mine selector (for multi-mine users)
- [ ] Auto-refresh every 5 minutes
- [ ] Role-based widget visibility
- [ ] Loading skeletons

### Compliance List Page
- [ ] Table with columns: title, category, mine, status, due date, risk score
- [ ] Filters: status, category, mine, date range, severity
- [ ] Search bar (full-text)
- [ ] Sort by any column
- [ ] Pagination (cursor-based, 20 per page)
- [ ] Bulk actions (for admins): assign, change status
- [ ] Status badges with colors
- [ ] Overdue highlight (red background)
- [ ] Export to Excel/CSV
- [ ] "Add New" button (role-restricted)
- [ ] Empty state illustration
- [ ] Loading skeletons

### Compliance Detail Page
- [ ] Header: title, status badge, category, regulation reference
- [ ] Timeline: status history with timestamps and actors
- [ ] Evidence section: uploaded files with preview
- [ ] Checklist responses (if template-based)
- [ ] Approval section: approve/reject with remarks (for managers)
- [ ] Remarks/comments thread
- [ ] Linked violations (if any)
- [ ] Audit log (who did what when)
- [ ] Edit button (role-restricted)
- [ ] Print-friendly view

### Inspection Wizard (Conduct Inspection)
- [ ] Step 1: Select template, mine, area
- [ ] Step 2: Checklist items (dynamic form from template)
- [ ] Step 3: Photo capture (camera integration)
- [ ] Step 4: Summary, GPS location, weather
- [ ] Step 5: Digital signature, submit
- [ ] Progress indicator (stepper)
- [ ] Save draft functionality
- [ ] Back/next navigation
- [ ] Validation on each step
- [ ] Auto-save every 30 seconds

### Violation Detail Page
- [ ] Header: title, severity badge, status
- [ ] Location on mini-map
- [ ] Photos gallery
- [ ] Description, root cause, regulation reference
- [ ] Timeline: full status history
- [ ] Corrective actions list with status
- [ ] Assign/reassign action
- [ ] Escalation indicator
- [ ] Related inspection link
- [ ] Comments section
- [ ] Print report button

### Maps Page
- [ ] Full-screen map with Leaflet
- [ ] Layer controls: mines, violations, inspections, attendance
- [ ] Mine boundary polygons
- [ ] Violation markers (color by severity)
- [ ] Inspection markers (color by score)
- [ ] Heat map toggle (violation density)
- [ ] Click marker for popup details
- [ ] Search/filter by mine
- [ ] Legend
- [ ] Zoom controls

### AI Insights Page
- [ ] Risk score cards per mine (color-coded: green/yellow/red)
- [ ] Risk trend chart (line chart, 30/90 days)
- [ ] Top predicted compliance failures (table)
- [ ] Anomaly alerts (cards with severity and description)
- [ ] Contributing factors breakdown (bar chart)
- [ ] Model confidence indicator
- [ ] Refresh/recompute button
- [ ] Date range selector

---

## 20. Production Readiness

### 20.1 Pre-Launch Checklist

**Infrastructure:**
- [ ] AWS resources provisioned and tested
- [ ] SSL certificates issued and configured
- [ ] DNS configured and propagated
- [ ] Database backups configured (daily, 30-day retention)
- [ ] Database failover tested (Multi-AZ)
- [ ] Auto-scaling policies configured
- [ ] CloudWatch alarms set (CPU > 80%, error rate > 5%, response time > 1s)
- [ ] S3 lifecycle policies (move old files to Glacier after 1 year)

**Application:**
- [ ] All environment variables set in production
- [ ] Debug mode OFF
- [ ] CORS restricted to production domains
- [ ] Rate limiting enabled
- [ ] Error tracking (Sentry) connected
- [ ] Health check endpoints respond
- [ ] Database migrations applied
- [ ] Seed data loaded (reference data: categories, templates, roles)

**Security:**
- [ ] Security headers configured
- [ ] HTTPS enforced (HTTP → HTTPS redirect)
- [ ] No default passwords
- [ ] Secrets in AWS Secrets Manager
- [ ] VPC security groups reviewed
- [ ] S3 buckets private
- [ ] API keys rotated

**Monitoring:**
- [ ] Prometheus scraping all services
- [ ] Grafana dashboards: system metrics, business metrics, error rates
- [ ] Alert rules: service down, high error rate, slow response, disk space
- [ ] Log aggregation working (CloudWatch or ELK)
- [ ] On-call rotation defined (for production operation)

**Documentation:**
- [ ] API documentation complete (Swagger)
- [ ] Deployment runbook written
- [ ] Rollback procedure documented
- [ ] Architecture diagrams current
- [ ] User guide (for demo/presentation)

### 20.2 Rollback Procedure
1. Identify failing service (CloudWatch alarms)
2. Check ECS deployment status
3. Roll back to previous task definition: `aws ecs update-service --force-new-deployment --task-definition <previous>`
4. If DB migration involved: run down migration
5. Verify health checks pass
6. Notify team
7. Post-mortem within 24 hours

### 20.3 Estimated AWS Monthly Cost (Pilot: 1-5 mines)

| Service | Spec | Est. Cost/Month |
|---------|------|----------------|
| ECS Fargate | 12 tasks × 0.5 vCPU × 1GB | $60-80 |
| RDS PostgreSQL | db.t3.medium, 50GB, Multi-AZ | $70-90 |
| ElastiCache Redis | cache.t3.micro | $15-20 |
| Amazon MQ (RabbitMQ) | mq.t3.micro | $20-25 |
| S3 | 50GB storage + transfers | $5-10 |
| ALB | 1 ALB + data transfer | $20-30 |
| CloudFront | 100GB transfer | $10-15 |
| CloudWatch | Logs + metrics | $10-20 |
| SES | 10,000 emails | $1 |
| Route 53 | 1 hosted zone | $0.50 |
| **Total** | | **$210-290/month** |

---

## Appendix A: Makefile Commands

```makefile
.PHONY: dev test lint build deploy

dev:                    ## Start all services locally
	docker compose up -d
	cd apps/web && npm run dev

dev-backend:            ## Start only backend services
	docker compose up -d

dev-frontend:           ## Start only frontend
	cd apps/web && npm run dev

test:                   ## Run all tests
	cd services/auth-service && pytest
	cd services/compliance-service && pytest
	cd apps/web && npm test

test-e2e:               ## Run E2E tests
	cd apps/web && npx playwright test

lint:                   ## Lint all code
	cd services && ruff check .
	cd apps/web && npx eslint .

migrate:                ## Run DB migrations
	cd services/auth-service && alembic upgrade head
	cd services/compliance-service && alembic upgrade head

seed:                   ## Seed demo data
	python scripts/seed-data.py

build:                  ## Build Docker images
	docker compose build

deploy-staging:         ## Deploy to staging
	./scripts/deploy.sh staging

deploy-prod:            ## Deploy to production (requires confirmation)
	./scripts/deploy.sh production
```

---

## Appendix B: Environment Variables

```env
# .env.example

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

# Email (SMTP)
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
RISK_SCORE_RECOMPUTE_SCHEDULE=0 2 * * *  # Daily at 2 AM
```

---

## Appendix C: Key Technical Decisions (ADRs)

### ADR-001: Microservices over Monolith
**Decision:** Microservices architecture with shared PostgreSQL (schema-per-service).
**Reason:** Team of 3 can work independently. Scales per-service. Faculty expects enterprise architecture.
**Trade-off:** More operational complexity. Mitigated by Docker Compose locally, ECS Fargate in prod.

### ADR-002: FastAPI over Django
**Decision:** FastAPI for all backend services.
**Reason:** Async-native, faster, auto-docs, better for microservices. Django is monolith-oriented.
**Trade-off:** No built-in admin panel. Acceptable — we build custom admin in Next.js.

### ADR-003: PostgreSQL + PostGIS (single instance, multiple schemas)
**Decision:** One PostgreSQL instance with schema-per-service isolation.
**Reason:** True separate databases per service is overkill for 3-person team. Schema isolation gives logical separation with operational simplicity.
**Trade-off:** Can't scale DB per-service independently. Acceptable at our scale.

### ADR-004: Next.js over React SPA
**Decision:** Next.js 14 with App Router.
**Reason:** SSR for faster initial load on slow mine-area connections. RSC reduces client JS. Built-in API routes for BFF pattern.

### ADR-005: Open Source ML first
**Decision:** scikit-learn + XGBoost for all ML models. No paid APIs initially.
**Reason:** Budget constraint. These algorithms work well for structured/tabular data. GPU not needed.
**Migration:** Switch NLP tasks to Claude API when budget allows, for better document understanding.

### ADR-006: WatermelonDB for Mobile Offline
**Decision:** WatermelonDB (SQLite-backed) for React Native offline storage.
**Reason:** Purpose-built for offline-first React Native apps. Lazy loading, sync primitives, observable queries.
**Trade-off:** Learning curve. Worth it for reliable offline support.

---

*This document is the single source of truth for the project. Update it as decisions change. Every team member should read it fully before starting work.*

---

> **To Claude Code:** After reading this document, start by asking me the 15 questions listed in Section 1.9. Then proceed with Phase 0 setup. Build iteratively — complete one phase fully before starting the next. Always run tests before marking a phase complete. If you encounter an ambiguity not covered here, ask before assuming.
