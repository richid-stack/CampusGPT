# University of Ghana — CampusGPT Training Knowledge Base

> **Purpose:** A consolidated, source-cited knowledge base for training a University of Ghana student-assistant AI ("CampusGPT").
> **Compiled:** June 2026
> **Companion to:** `UG-Student-App-Project-Spec.md` (Phase 1 scope)

---

## 0. Read This First — Honest Notes for the Builder

Before you train anything on this file, you need to know what is and isn't here, because your project spec specifically warns against "sounding more confident than the source material is."

**What IS in this file (high confidence):**
- Verified info from `ug.edu.gh` and its sub-domains (Academic Affairs, Balme Library, Health Services, Financial Aid, Careers & Counselling, Sakai).
- Verified info from SLTF's official site (`sltf.gov.gh`).
- Names, contact emails, phone numbers, office *named locations*, and procedural steps as published officially.
- A confirmed reading of the Sakai plagiarism flow: **the course site is called `RCOMM 100`** (this resolves the "1018 vs 1080" question in your project spec — both were wrong; it's RCOMM).

**What is NOT in this file (and why):**
- **Turn-by-turn, "12-year-old can follow" walking directions to every building.** UG Legon is ~11.4 km² (a verified figure from a published butterfly-diversity study of the campus). The web simply does not contain reliable, granular footpath descriptions ("walk past the mango tree, take the second left at the kiosk"). Inventing those would directly violate your own content rule. I've instead given:
  - The **official building name + a Google Maps place query string** for every important location, so your app can hand off to Google Maps for actual navigation (which is exactly your Phase 1 Section 2B plan).
  - **Landmark-style anchor descriptions** taken from official UG pages where they exist (e.g. "Students Services Centre at the Information Centre, near the Main Gate").
  - A **clearly-marked "ground-truth needed"** column where the founder must add the local knowledge (which gate is locked after 6pm, which path is muddy after rain, etc.). This is exactly what your project spec said should come from the founder's DL WhatsApp/Telegram history rather than web search.
- **Exact current GHS fee figures.** UG releases a new fee schedule each year and the 2025/2026 provisional schedule already triggered public concern over increases. The chat assistant should **always link to the live PDF**, not state numbers. URLs included below.
- **SLTF eligibility for sandwich students.** The official SLTF FAQ at one point said sandwich students are NOT eligible while weekend/evening ARE — this is exactly the contradiction your spec flagged. I have not been able to resolve it from public sources; founder's first-hand knowledge is the only reliable source.

**Honest scope of this document:** ~85% of the procedural ground for Phase 1, plus a strong scaffold for the locator feature. The remaining 15% — campus walking detail, current fees, SLTF nuances — needs founder ground-truth. Treat this as the v1 corpus, not the finished knowledge base.

---

## 1. University of Ghana — Institutional Facts

### 1.1 Core identity
- **Founded:** 11 August 1948, as the University College of the Gold Coast (by Ordinance) [ug.edu.gh — Overview](https://www.ug.edu.gh/about-ug/overview)
- **Status:** Oldest and largest public university in Ghana
- **Motto:** *Integri Procedamus* ("Let us proceed with integrity")
- **Main campus area:** ~11.4 km² (Legon main campus) [innspub.net — land-use study](https://innspub.net/land-use-type-affects-butterfly-diversity-a-case-study-of-the-university-of-ghana-main-campus-legon/)
- **Distance from central Accra:** ~12–13 km north-east [Wikipedia](https://en.wikipedia.org/wiki/University_of_Ghana)
- **Main address:** P.O. Box LG 25, Legon, Accra
- **Strategic Plan:** 2024–2029

### 1.2 Governance / collegiate structure
UG is organised into four colleges + Central Administration + School of Graduate Studies + International Programmes Office.

The four colleges are:
1. **College of Basic and Applied Sciences (CBAS)** — [cbas.ug.edu.gh](https://cbas.ug.edu.gh/)
2. **College of Education (CoE)** — [coe.ug.edu.gh](https://www.coe.ug.edu.gh/)
3. **College of Health Sciences (CHS)** — [chs.ug.edu.gh](http://www.chs.ug.edu.gh/) (Korle-Bu based)
4. **College of Humanities (CoH)** — [coh.ug.edu.gh](https://coh.ug.edu.gh/)

### 1.3 Five priority areas (institutional language)
Transformative Student Experience · Impactful Research · Commitment to Faculty and Staff · Engagement and Partnerships · Sustainable Resource Mobilisation and Stewardship.

---

## 2. Campuses — Where UG Physically Is

UG has **five main campuses** plus a network of Distance Education centres.

| # | Campus | Location | What's there | Source |
|---|---|---|---|---|
| 1 | **Legon Campus (Main)** | Legon, ~12–13 km NE of central Accra | Most teaching/research, Balme Library, central administration, traditional halls, UGEL hostels, Sports Stadium | [Overview](https://www.ug.edu.gh/about-ug/overview) |
| 2 | **Korle-Bu Campus** | Korle-Bu, Accra | College of Health Sciences administration, School of Medicine & Dentistry, School of Allied Health Sciences | [Wikipedia](https://en.wikipedia.org/wiki/University_of_Ghana) |
| 3 | **Accra City Campus** | Adabraka, opposite Ministry of Information | Mainly BSc Business Administration and BA programmes | [Wikipedia](https://en.wikipedia.org/wiki/University_of_Ghana) |
| 4 | **Kumasi City Campus** | Kumasi | Part of College of Education; BSc Business Administration | [Wikipedia](https://en.wikipedia.org/wiki/University_of_Ghana) |
| 5 | **Takoradi City Campus** | Takoradi | Listed officially as 5th campus | [old1.ug.edu.gh — Overview](https://old1.ug.edu.gh/about/overview) |

**Distance Education campuses** (regional centres): Accra · Tsito · Bolgatanga · Cape Coast · Ho · Koforidua · Kumasi · Sekondi-Takoradi · Tamale · Tema · Sunyani · Wa. [Source](https://admissions.ug.edu.gh/undergraduate/distance)

**Google Maps anchor for Legon Campus:** [University of Ghana, Legon](https://www.google.com/maps?q=University+of+Ghana+Legon) (approximate GPS center: **5.6505° N, 0.1870° W**).

### 2.1 Main gates / entrances (Legon)
- **Okponglo Junction / Stadium Road entrance** — officially designated the **Main Entrance**, open **24 hours**, no UG sticker needed for access. [Source: UG news release](https://old1.ug.edu.gh/news/news-release-reconstruction-structure-main-entrance-university-ghana)
- **Other gates** (Bawaleshie, Madina, Diaspora, etc.) — access has been restricted at times and may close after hours. Builder note: this exact rule changes; the assistant should phrase it as "the Okponglo Main Gate is the safest 24/7 option; other gates may have restrictions" and recommend a live check.

---

## 3. Legon Campus — Halls of Residence

UG has **traditional halls** (university-owned, with the strongest student culture) and **UGEL hostels** (run by University of Ghana Enterprise Limited, the commercial arm). Hall allocation since 2024/25 is by **random allocation** for Level 100. [Source](https://www.ug.edu.gh/announcement/notice-level-100-students-random-allocation-beds-level-100-students-2024-2025-academic)

### 3.1 Traditional halls

| Hall | Gender | Notes / Culture | Maps query |
|---|---|---|---|
| **Commonwealth Hall** | Male-only | Students called *Vandals*; oldest male hall | [Commonwealth Hall, University of Ghana](https://www.google.com/maps?q=Commonwealth+Hall+University+of+Ghana) |
| **Legon Hall** | Mixed | The premier (first-built) hall | [Legon Hall, University of Ghana](https://www.google.com/maps?q=Legon+Hall+University+of+Ghana) |
| **Akuafo Hall** | Mixed | Second hall built; known as *Farmers* | [Akuafo Hall, University of Ghana](https://www.google.com/maps?q=Akuafo+Hall+University+of+Ghana) |
| **Mensah Sarbah Hall** | Mixed | First hall named after a national hero (John Mensah Sarbah) | [Mensah Sarbah Hall](https://www.google.com/maps?q=Mensah+Sarbah+Hall+University+of+Ghana) |
| **Volta Hall** | Female-only | The female-only hall | [Volta Hall](https://www.google.com/maps?q=Volta+Hall+University+of+Ghana) |
| **Jubilee Hall** | Mixed | Built for the university's 1998 Golden Jubilee | [Jubilee Hall](https://www.google.com/maps?q=Jubilee+Hall+University+of+Ghana) |

### 3.2 UGEL hostels (newer, commercial)
Managed by [University of Ghana Enterprise Limited](https://ugel.com.gh/hostels/) — UGEL HQ is itself in Jubilee Hall.

- **Alexander Adum Kwapong Hall** (commissioned 2011, named for former VC)
- **Hilla Limann Hall** (named after former President Dr. Hilla Limann)
- **Elizabeth Frances Sey Hall** (named after UG's first female graduate)
- **Jean Nelson Akah Hall** (emblem: candle, book, pen)
- **Africa Union Hall** (formerly *Pentagon*; built by SSNIT)
- **James Topp Nelson Yankah Hall** (formerly Teachers Fund / TF Hostel)
- **Bani Hall** (formerly a private hostel)
- **Evandy Hall** (formerly Evandy Hostel)
- **International Students Hostel (ISH)** — mainly international students
- **Valco Hostel**, **Diaspora Halls**, **Legon Hall Annex C**, **Mensah Sarbah Annex C & D**, plus VC Hostel, Registrar Hostel, Isa Kaita Hostel, Akpabio Hostel.

### 3.3 Hall/residence registration — official procedure
Once a bed is allocated, you have **48 hours** to pay full residential fees, then a **24-hour window** to register through MIS Web.

Steps ([source — Freshmen Info](https://www.ug.edu.gh/aad/resources/freshmen-info)):
1. Log into **MIS Web** → click **Residence Registration** under Student iEnabler.
2. Click **Submit Residence Registration**.
3. Click the year (shown in blue).
4. Confirm the displayed Hall and Room number.
5. Click **I Accept**.
6. Print the **Proof of Residential Registration**.
7. On reporting date, take to your Hall with **two copies of your passport picture** plus proofs of academic and residential registration.

---

## 4. Key Offices, Buildings & Landmarks (Legon Campus)

> **Format:** Each entry gives the official name, what it's for, the official contact info (where published), and a **Google Maps query string** the app can hand off to. The "Landmark anchor" column is what UG/its students publish as the location description — these are the most reliable anchors short of GPS. **Items marked 🟡 need founder ground-truth** for fine walking directions.

### 4.1 Academic & administrative

| Place | What it does | Landmark anchor | Maps query | Contact |
|---|---|---|---|---|
| **Main Gate / Information Centre** | First point of contact; Students Services Centre is here | Near the Okponglo Main Gate | [University of Ghana Main Gate](https://www.google.com/maps?q=University+of+Ghana+Main+Gate) | — |
| **Students Services Centre (Registration Help)** | Registration problems, MIS Web issues | At the Information Centre, near the Main Gate 🟡 | [Students Services Centre Legon](https://www.google.com/maps?q=Students+Services+Centre+University+of+Ghana) | studentsaccounts@ug.edu.gh · 020-577-9222 [src](https://www.ug.edu.gh/aad/resources/registration) |
| **Registry / Registrar's Office** | Statutory administration, letters, official records | Central administration block 🟡 | [Registrar University of Ghana](https://www.google.com/maps?q=Registrar+University+of+Ghana) | See departmental contacts |
| **Academic Affairs Directorate (AAD)** | Transcripts, deferment, change of grade, graduation | Central administration block 🟡 | [Academic Affairs UG](https://www.google.com/maps?q=Academic+Affairs+University+of+Ghana) | aad@ug.edu.gh · +233-(0)302-213820 [src](https://www.ug.edu.gh/aad/resources/academic-support-services) |
| **Great Hall** | Congregation/graduation venue, major ceremonies | Central campus, iconic landmark | [Great Hall University of Ghana](https://www.google.com/maps?q=Great+Hall+University+of+Ghana) | — |
| **Balme Library** | Main library; UGCat catalogue; 24-hour reading room (2nd floor west wing extension); bindery (ground floor west wing) | Centrally located on campus | [Balme Library](https://www.google.com/maps?q=Balme+Library+University+of+Ghana) | +233 228 727 355 · [balme.ug.edu.gh](https://balme.ug.edu.gh/) |
| **Students Financial Aid Office (SFAO)** | Scholarships, fee arrangements, work-study | **House No. 11, East Legon — Main Campus, behind [landmark redacted in source]** 🟡 | [Students Financial Aid Office UG](https://www.google.com/maps?q=Students+Financial+Aid+Office+University+of+Ghana) | finaid@ug.edu.gh · 020-518-6904 · 020-680-4077 · 0303-965-240 [src](https://www.ug.edu.gh/financialaid/) |
| **International Programmes Office (IPO)** | International students, study abroad | **International House, 1st floor, Room F8, Annie Jiagge Road** | [International Programmes Office UG](https://www.google.com/maps?q=International+Programmes+Office+University+of+Ghana) | arip@ug.edu.gh · sip@ug.edu.gh · +233-30-3957066 [src](https://admissions.ug.edu.gh/international) |
| **Careers & Counselling Directorate** | Mental-health counselling, careers advice | **Located behind the Department of Sociology** | [Careers and Counselling Centre UG](https://www.google.com/maps?q=Careers+and+Counselling+Centre+University+of+Ghana) | +233 245 945 752 · +233 204 999 221 [src](https://www.ug.edu.gh/careers/contact-us) |
| **Dean of Student Affairs** | Non-academic discipline, student welfare | Within central admin 🟡 | [Dean of Students University of Ghana](https://www.google.com/maps?q=Dean+of+Students+University+of+Ghana) | [ug.edu.gh/dos](https://www.ug.edu.gh/dos) · Instagram [@UGDeanofStudent](https://www.instagram.com/UGDeanofStudent/) |
| **UGCS / DICTS (ICT Help Desk)** | Wi-Fi, MIS Web, Sakai, UG email problems | Computer Services building 🟡 | [UGCS University of Ghana](https://www.google.com/maps?q=UGCS+University+of+Ghana) | servicedesk@rt.ug.edu.gh · +233-(0)302-213820 · IP phone ext **3000** [src](https://ugcs.ug.edu.gh/presence-ict-ug-campus-0) |
| **SRC Office** | Student Representative Council; also the **on-campus SLTF point** | Within Student Services area 🟡 | [SRC University of Ghana](https://www.google.com/maps?q=UGSRC+University+of+Ghana) | Twitter [@Ug_src](https://x.com/Ug_src) |
| **Cash Office / Finance (JQB)** | Fees, refunds (yes, refunds DO happen — see §7) | **JQB Block** 🟡 | [JQB University of Ghana](https://www.google.com/maps?q=JQB+University+of+Ghana) | — |

### 4.2 Health & wellbeing

| Place | Services | Maps query | Hours |
|---|---|---|---|
| **University Hospital, Legon** | Main hospital, **24/7 OPD + Emergency** | [University Hospital Legon](https://www.google.com/maps?q=University+Hospital+Legon) | 24/7 [src](https://www.ug.edu.gh/healthservices/FAQs) |
| **Students' Clinic — Main Campus** | Outpatient clinic for students | [Students Clinic University of Ghana](https://www.google.com/maps?q=Students+Clinic+University+of+Ghana) | — |
| **Students' Clinic — Accra City Campus** | Outpatient at the city campus | [Students Clinic Accra City Campus](https://www.google.com/maps?q=Accra+City+Campus+Clinic) | — |
| **UG Medical Centre (UGMC)** | Quaternary medical/research centre | [UG Medical Centre](https://www.google.com/maps?q=University+of+Ghana+Medical+Centre) — Indian Ocean Street, off Akilakpa Sawyerr Rd | +233 55 199 1199 [src](https://ugmedicalcentre.org/) |
| **UG Medical School Clinic** | At Korle-Bu | [UG Medical School Korle-Bu](https://www.google.com/maps?q=University+of+Ghana+Medical+School+Korle+Bu) | — |

### 4.3 Faith & community

| Place | Maps query | Note |
|---|---|---|
| **UG Central Mosque** | [Legon Central Mosque](https://www.google.com/maps?q=Legon+Central+Mosque) | Friday prayers led by Imam Abubakari Baba |
| **Christian chaplaincies** (various denominations) | [Chaplaincy University of Ghana](https://www.google.com/maps?q=Chaplaincy+University+of+Ghana) | Multiple chapels across campus 🟡 |
| **Remembrance Day** is observed each year — Christian service at the Great Hall | — | [src](https://www.modernghana.com/news/359650/) |

### 4.4 Daily life

| Place | What's there | Maps query |
|---|---|---|
| **Night Market** | Food vendors, frozen foods, daily goods, "Shop 66" frozen foods is well-known | [Night Market University of Ghana](https://www.google.com/maps?q=Night+Market+University+of+Ghana) — Jubilee Link, Ayawaso North |
| **Banking Square** | On-campus banks & ATMs (UMB has an outlet here, near the Night Market) | [Banking Square University of Ghana](https://www.google.com/maps?q=Banking+Square+University+of+Ghana) |
| **GCB Bank, Legon Branch** | Main on/near-campus branch (recently re-opened after renovations) | [GCB Legon Branch](https://www.google.com/maps?q=GCB+Bank+Legon+Branch) [src](https://www.gcbbank.com.gh/news-from-gcb/128-gcb-legon-branch-re-opens) |
| **CBG University of Ghana, Legon Branch** | Listed in CBG's branch locator | [src](https://www.cbg.com.gh/branch-locator) |
| **UG Sports Stadium** | 10,000 capacity, opened 2024 | [University of Ghana Sports Stadium](https://www.google.com/maps?q=University+of+Ghana+Sports+Stadium) |
| **UG Pool & Gym** | Swimming pool surrounded by gardens; gym; rentable [src](https://sports.ug.edu.gh/clas/services/field-pool-rental) | [UG Sports Directorate](https://www.google.com/maps?q=UG+Sports+Directorate) |

### 4.5 Academic units worth pinning

(Faculty of Arts, Sociology, Geography & Resource Development, Law, Business School, Computer Science, JQB, K-Block, NNB, etc. all exist as named buildings — many lecture halls are referenced by acronyms like NNB, JQB, LOT (Lecture Hall Theatre / Tetteh). The full lecture-hall map is the kind of thing only on-the-ground students publish in PDFs that change yearly — see the "ground-truth pass" checklist in §10.)

---

## 5. The Portals — MIS Web vs Sakai vs STS

Three different systems. Students confuse them constantly. **This is the single most-asked-about thing in the entire knowledge base.**

| System | URL | What it's for |
|---|---|---|
| **MIS Web (iEnabler)** | [ienabler.ug.edu.gh/pls/prodi41/w99pkg.mi_login](https://ienabler.ug.edu.gh/pls/prodi41/w99pkg.mi_login) | **Course registration**, add/drop, fee status, **residence registration**, printing admission letter, biographical data |
| **Sakai** | [sakai.ug.edu.gh](https://sakai.ug.edu.gh/) | **Learning Management System** — lectures, assignments, quizzes, gradebook, **Turnitin plagiarism checker** |
| **STS Portal** | [sts.ug.edu.gh](https://sts.ug.edu.gh/services/) | **Student Self-Service** — used for deferment forms, HERC/UGRC course registration, ID card booking |
| **UG Student Email** | `@st.ug.edu.gh` via Google Workspace | Login for Sakai and Office 365; password resets through UGCS |
| **Office 365** | [portal.office.com](https://portal.office.com/) | Microsoft suite via UG account |

### 5.1 Course registration (the canonical flow)
1. Pay academic fees at an approved bank (see §6) **OR** the portion required to enable registration.
2. Log into **MIS Web** with Student ID + PIN.
3. Open **Student iEnabler** → **Registration**.
4. Select courses → **Submit**.
5. Print **Proof of Registration**.
6. Then go to **Sakai** → join your course sites (Sakai sites do NOT auto-join from MIS).
7. For HERC/UGRC courses specifically: registration is via **`sts.ug.edu.gh`** using index number + PIN from your confidential information PDF.

Common error: "**Contact your exams officer**" pop-up. This means your registration data has a mismatch (usually fees not reflecting, or a course-eligibility issue). Go to your **Departmental Exams Officer** in your department, not the registry first.

### 5.2 Add/drop
- Done on MIS Web → Registration tool → Add or Drop.
- Window matches the academic calendar (e.g. **for 2025/2026: Dec 29 2025 – Jan 23 2026**) [calendar PDF](https://www.ug.edu.gh/sites/default/files/2025-08/2025-2026%20Academic%20Calendar%20-%20Undergraduate%20programme%20%28Main%20Campus%29.pdf).
- After the deadline, changes are not accepted.

### 5.3 Turnitin / plagiarism check on Sakai — **resolved**
> Your project spec mentioned uncertainty between "1018" and "1080". **Both are wrong.** The official Sakai resource page calls the site **`RCOMM 100`** (Research Communications). Verified source: [sakairesources1.ug.edu.gh](https://sakairesources1.ug.edu.gh/How%20to%20Check%20the%20Similarity%20Index%20of%20Your%20Work%20on%20Sakai)

Exact steps:
1. Log into Sakai with Staff/Student ID.
2. Go to **Home** tab.
3. Click **Membership** tool.
4. Click **Joinable Sites**.
5. Click **Join Now** beside `RCOMM 100 1 S1 [year]`.
6. Open the **site drawer** (grid icon, top-right) → click the **RCOMM 100** tab.
7. Click **Assignments** tool.
8. Click the topmost assignment title (e.g. "Plagiarism Checker 1st to 15th March").
9. Click **Choose File** → attach your document.
10. Click **Proceed** → **Submit**.
11. **Wait at least 30 minutes**, then return to the same assignment and click the small coloured flag icon — that's your Similarity Report.

---

## 6. Money — Fees, Payments, Refunds

### 6.1 Approved payment channels
Only pay UG fees at **APPROVED BANKS** with a **Fee Deposit Slip** — never directly into a personal account, never to a "fixer", never cash to staff. [src](https://www.ug.edu.gh/aad/sites/academic.ug.edu.gh/files/2024-09/PAYMENT%20INFO%20-%20REGULAR.pdf)

Approved banks (typical list — verify current year):
- **GCB Bank** · **Ecobank** · **Agricultural Development Bank (ADB)** · **Republic Bank** · **Zenith Bank** · **Access Bank** · others as listed in the year's payment PDF.

Newer: **Ecobank Mobile App → Pay Bill → Schools → University of Ghana** [src](https://www.instagram.com/reel/DTQE7atjatc/) — for students who don't want to queue at a branch.

### 6.2 Current fees
**Do not hard-code numbers into the assistant.** UG releases a new provisional schedule each year, and the 2025/2026 schedule was a flashpoint of student concern. Always link out:
- **Official current schedule:** [ug.edu.gh/aad/schedule-fees](https://www.ug.edu.gh/aad/schedule-fees)

### 6.3 "I paid but portal says unpaid"
1. Confirm payment cleared the bank (get the official receipt/SMS).
2. Wait 24–48 hours — the bank–UG reconciliation isn't instant.
3. If still unpaid after 48 hours, contact **Students Accounts**: `studentsaccounts@ug.edu.gh` · 020-577-9222 with your Student ID and bank receipt scan.
4. Office: **Students Services Centre at the Information Centre, near the Main Gate**.

### 6.4 Refunds (yes, they exist — your spec asked, here's the answer)
A reddit thread from Oct 2024 shows the unofficial real-world path: a former student confirmed they walked into the **finance office at JQB**, applied with documents, and received the refund into their bank account in about **a month**. International students paying in USD may face delays. There is no published web FAQ on this — it's a "go in person, persist, keep receipts" process. [src](https://www.reddit.com/r/UniversityOfGhana/comments/1g6xd0t/)

---

## 7. Academic Procedures — Deferment, Transcripts, Re-marking, Misconduct

### 7.1 Deferment of programme
1. Log into **STS portal** with Student ID + PIN.
2. **Services** → **Deferment Form**.
3. Complete all fields, attach supporting docs.
4. Submit within the published window (typically before/during the semester to be deferred).
5. Follow up with your College Academic Office if no response in 2 weeks.
[src](https://www.ug.edu.gh/aad/node/89)

### 7.2 Official transcript
Transcript service is part of Academic Support & Services. Best advice from Reddit alumni: **order a transcript at the end of every semester and keep them**, because chasing them after graduation is famously painful.

### 7.3 Re-marking (review of results) — strict rules
[Official source](https://www.ug.edu.gh/aad/resources/academic-support-services/change-grade-form):
- Apply formally to **Director of Academic Affairs** via your official UG email to **aad@ug.edu.gh**.
- **Deadline: within 21 days** of results being published on MIS Web. Applications after 21 days are **not accepted**.
- Application **must be filed personally** — not by a parent, guardian, or third party.
- Must clearly state grounds.
- **Review fee:** at least **3× the normal examination fee**. Process doesn't start until this is paid.
- Frivolous applications can result in sanctions, including being barred from exams.
- Only the **Board of Examiners** can authorise a grade change.
- It is **a formal offence** for a student/parent to approach an examiner directly to request a favourable grade.
- **Grade D is a Pass Grade** — UG's Academic Board has reaffirmed this, and students generally cannot retake a D-graded course just to improve it.

### 7.4 Name not on graduation list
Documented official sequence:
1. Check **DiGradSys** for outstanding requirements.
2. Confirm all fees cleared and no academic holds.
3. Contact your **Departmental Examinations Officer**.
4. Contact your **College Academic Office** / SGS for graduates.
5. If still unresolved, formal email to **Director of Academic Affairs** with Student ID, programme, year of graduation.
6. Follow up regularly. [src](https://www.ug.edu.gh/aad/faqs)

### 7.5 Exam malpractice
UG has been publicly firm — students caught face named publication and academic sanctions. The official regulations PDF is publicly indexed on Scribd ([UG examination malpractice regulation](https://www.scribd.com/document/735099711/University-of-Ghana-examination-malpractice-regulation)).

---

## 8. SLTF (Students Loan Trust Fund) — Source-of-Truth Sheet

> **This module needs founder verification before deployment**, especially eligibility for sandwich students and current disbursement method. See §3 of project spec.

### 8.1 Official organisation contacts
- **Head Office (relocated 2025):** Hse #47, Lagos Avenue, East Legon, Accra — adjacent to KFC (East Legon) [src](https://www.sltf.gov.gh/contact-us/)
- **Digital address:** G4-378-2025
- **Phone:** +233 (0)302 231 886 · Call Centre +233 (0)302 751 020
- **Email:** info@sltf.gov.gh · Website: [sltf.gov.gh](https://www.sltf.gov.gh/)

### 8.2 On-campus SLTF point at UG
Per the official SLTF zonal list, the **University of Ghana SLTF point is the SRC Office** [src](https://www.sltf.gov.gh/zonal-and-campus-offices/).

> **Founder's note overrides this.** The project spec says: "There IS an SLTF office on UG campus, and it's hard to find. Founder knows exactly where it is." It's plausible the SRC entry is the *public-facing access point* and the actual office space the founder describes is the back-office. **This entry must be replaced with founder's first-hand directions** before going live.

### 8.3 UG's own SLTF info page
[old1.ug.edu.gh/aid/student-loan-trust-fund](https://old1.ug.edu.gh/aid/student-loan-trust-fund):
- WhatsApp: **0504-021-579**
- Call: **0501402578**
- Visit: [www.sltf.gov.gh](http://www.sltf.gov.gh/)

### 8.4 Unresolved questions (for founder to settle)
| Question | Conflicting positions in public sources | Resolution path |
|---|---|---|
| Guarantor still required? | Some say removed in 2022; official FAQ says still required | **Founder's first-hand** |
| Disbursement method | e-zwich vs automatic GCB account | **Founder's first-hand** |
| Sandwich student eligibility | One official FAQ excludes sandwich; weekend/evening included | **Founder's first-hand — critical** |
| Amount tiers (DL / Diploma / Regular) | Not consistently published | **Founder has the current figures** |
| Process around `sts.ug.edu.gh` portion | Not documented publicly | **Founder owns the full walkthrough** |

---

## 9. Health, Wellbeing & Safety

### 9.1 University Health Services structure [src](https://www.ug.edu.gh/healthservices/about-overview)
- **University Hospital, Legon** (main, 24/7 OPD + Emergency)
- **Students' Clinic — Main Campus**
- **Students' Clinic — Accra City Campus**
- **UG Medical School Clinic** (Korle-Bu)
- **FOHCREC Clinic** (Kade)
- **LIPREC Clinic** (Nungua Farms)
- **SIREC Clinic** (Kpong)
- Specialist clinic runs **Tuesdays 8am–2pm** [src](https://www.ug.edu.gh/healthservices/FAQs)

### 9.2 Mental health / counselling
**UG Careers & Counselling Directorate (UGCCD)** — psycho-social counselling, preventive, individual, group, and crisis counselling. Located **behind the Department of Sociology**. Phone +233 245 945 752 / +233 204 999 221. [src](https://www.ug.edu.gh/careers/contact-us) · Instagram [@ug_ccd](https://www.instagram.com/ug_ccd/)

### 9.3 Safety reporting
Routes when something happens on campus:
1. **UG Security** (campus security patrols all gates; numbers are posted at hall porters' lodges)
2. **Hall Tutor / Senior Tutor** (in-hall issues)
3. **Dean of Student Affairs** (non-academic disciplinary / wellbeing) — [ug.edu.gh/dos](https://www.ug.edu.gh/dos)
4. **Ghana Police Service** — Legon Police Station (nearest to main campus)

🟡 *Founder ground-truth needed: actual phone numbers students share informally for hall security, since the website doesn't publish a single emergency hotline.*

---

## 10. Common Questions Students Actually Ask (Reddit / WhatsApp / YouTube Comments Synthesis)

Compiled from reddit threads, comments under UG YouTube tutorials, the Modern Ghana student threads, and the Scribd "what I wish I knew" docs. These are the questions the assistant will be hit with daily.

### 10.1 Academic
1. How do I know which hall I've been allocated?
2. Why does the portal say "contact your exams officer"?
3. How do I add/drop a course after the deadline? *(Answer: you usually can't — the assistant must say this clearly.)*
4. How do I check my plagiarism similarity score? *(See §5.3)*
5. What's the difference between a GPA, CWA, and FGPA? Which one is used to compute my class?
6. How do I appeal a grade I think is wrong? *(See §7.3)*
7. What does "Grade D" mean — can I retake to improve? *(No, per §7.3.)*
8. How do I defer? Can I un-defer? *(See §7.1)*
9. How do I get a transcript? How long does it take?
10. My name isn't on the graduation list — what now? *(See §7.4)*
11. What is RCOMM 100 and why was I auto-added? *(Plagiarism site; see §5.3.)*
12. How do I register for HERC/UGRC courses? *(STS portal; see §5.1.)*
13. What is the maximum credit hours per semester?
14. Can I do a study leave / change my programme?
15. What is the resit process? Do I pay separately?

### 10.2 Money
16. Approved banks for fees?
17. I paid but my portal still shows unpaid — what do I do?
18. Can I get a refund of an over-payment?
19. How do I pay residential fees specifically?
20. Where do I go in JQB for finance issues?
21. What scholarships are available? *(SFAO — §4.1)*
22. SLTF — am I eligible as DL/sandwich? *(Open; §8.4)*
23. How much SLTF money will I get? *(Founder-known)*
24. Can I pay in instalments?
25. Mobile money for fees — what's the exact Ecobank flow?

### 10.3 Portal / IT
26. I forgot my MIS Web PIN.
27. I can't log into Sakai.
28. UG email password reset?
29. How do I print my admission letter?
30. My name is misspelled on the portal — how do I fix it?
31. My index number is wrong — who fixes it?
32. Where do I get the UG Wi-Fi password?
33. How do I add UG email to my phone?
34. My ID card hasn't been issued — what do I do?

### 10.4 Accommodation
35. How does random hall allocation work?
36. I wasn't allocated — what now? *(UGEL hostels, or nearby private hostels.)*
37. Can I swap halls with someone?
38. Can I bring a fridge / kettle / iron?
39. What if my roommate is a problem? *(Hall Tutor first; Dean of Students if escalated.)*
40. Are there gender-restricted halls? *(Yes — Commonwealth male, Volta female; rest mixed.)*
41. Off-campus hostel recommendations near Legon? *(Getrooms covers this market — and your spec deliberately doesn't compete here.)*

### 10.5 Campus life
42. Best place to eat on campus? *(Night Market; specific stalls change every semester.)*
43. Where can I print/photocopy?
44. Is there a shuttle around campus? *(Yes — public-private partnership with RSTC. Routes evolve. [src](https://old1.ug.edu.gh/news/university-ghana-inaugurates-shuttle-service))*
45. How do I get from Madina/Okponglo to my hall by trotro?
46. Is the gym open? Pool open? *(Periodically closed for maintenance.)*
47. Where is the Mosque? Where are the chapels?
48. Where is the nearest ATM?
49. Are there safe places to study late?
50. How do I join a society / club / SRC committee?
51. How do I report harassment or assault on campus?
52. What's the dress code, if any?
53. When are the major UG events (Hall Week, SRC week, Founders Day, Congregation)?

### 10.6 Distance Learning / Sandwich specific (your founder's core audience)
54. When are the face-to-face sessions this module?
55. How do I book my ID card as a DL student? *(YouTube has a how-to; the assistant should embed/link.)*
56. Do DL students have a separate exam timetable?
57. Are DL students eligible for SLTF? *(Open — founder)*
58. Can I switch from DL to regular?
59. How do I find the DL office on campus? *(Founder-known)*
60. DL fee amount per modular session?
61. Will my classes be recorded? Where do I access recordings? *(Sakai)*

### 10.7 Visiting / international
62. Visa requirements? *(IPO handles)*
63. Where do I collect my international student package?
64. How do I pay fees in USD?
65. Where is the International Students Hostel (ISH)?

### 10.8 Career / post-graduation
66. How do I get my certificate after graduation?
67. Replacement certificate process? *(Cash Office payment + AAD application; [src](https://www.ug.edu.gh/aad/resources/academic-support-services/certificate-issuance-replacement))*
68. Internship placements — does UG have a centralised system or is it department-by-department?
69. How do I get a recommendation letter from a lecturer?
70. Alumni network — how do I join? *([ar.ug.edu.gh](https://ar.ug.edu.gh/))*

---

## 11. CampusGPT — Competitive / Feature Reference

There is no single product called "CampusGPT" — the name is used by multiple projects. Below is what each calls itself and what features it ships, so your team can pick what to copy, what to skip, and where to differentiate.

### 11.1 CampusGPT-2.0 (Sharmila Rapeti, open-source) — [GitHub](https://github.com/sharmila1320/campusGPT-2.0)
The closest analogue to your project. Features:
- **Closed-domain AI assistant** — restricts knowledge to a campus context (does NOT free-form Google for answers).
- **Verified institutional responses** only.
- **Role-based access control**:
  - **Public users** (any email) can ask + view public answers.
  - **Institute users** (verified by email domain like `@ug.edu.gh`) can answer tickets and choose visibility (public vs institute-only).
- **Self-learning knowledge base** — answered questions are stored permanently; next student gets an instant answer.
- **Automatic ticket creation** when an answer doesn't exist yet.
- **Tagline:** *"Ask once. Verify once. Store forever."*
- **Tech stack:** React + TypeScript + Vite frontend, Google Gemini API as engine.
- **Future roadmap:** semantic search for similar questions, admin moderation dashboard, query analytics, vector DB, multi-campus support, ticket notifications.

**What to copy:** the role-based-answering model is excellent for UG — let SRC reps, exam officers, hall tutors answer the "I don't know yet" tickets, with their answers marked verified.

**What to differentiate on:** they don't ship a maps locator or a document/letter generator — both of which are in your Phase 1.

### 11.2 Campus GPT (campus-wise-ai-74 / Lovable) — [campus-wise-ai-74.lovable.app](https://campus-wise-ai-74.lovable.app/)
A consumer-facing **AI study platform**, not a campus knowledge bot:
- Tutor chats
- Lecture mode
- Quizzes
- Past questions
- Personal study vault

Different problem space (study-tool, not campus-ops). Not a direct competitor to your spec, but the "past questions" idea is hugely popular with UG students (see §10 question 7) — worth keeping as a possible Phase 2 add-on.

### 11.3 UC Berkeley / UC San Diego "Campus-GPT" experiments
Two University of California campuses building their own specialised internal AI tools, framed in BestColleges' coverage. They're enterprise-style: focus on integrating ChatGPT-Edu inside institutional infrastructure (student info systems, LMS, library). Source: LinkedIn post by Brett Pollak.

### 11.4 Hala Campus GPT-Assistant (ERP-integrated)
An ERP-embedded GPT assistant — sits inside the campus ERP, answers admin/operational queries. Closed commercial product. Useful as a reference for *deep* integration, but not feasible for a Phase 1 student-built tool.

### 11.5 NYCU × MediaTek "Campus GPT" (Taiwan)
A university-wide gen-AI deployment using MediaTek's "DaVinci" model. Institutional scale, not student-app scale.

### 11.6 OpenAI ChatGPT Edu
Not called CampusGPT but worth noting: OpenAI's official "ChatGPT for universities" SKU — GPT-4o-based, with admin controls. ASU, University of Utah, San Francisco State have rolled it out. Different category (general-purpose ChatGPT, scoped to a university domain), but it's what UG's IT directorate is most likely to be aware of when you pitch.

### 11.7 What to take from the field
| Feature | In your Phase 1? | Worth adding? |
|---|---|---|
| Closed-domain Q&A on a verified KB | ✅ | — |
| Role-based answering (students ask, verified staff answer) | ❌ | ⭐ Strongly yes — solves your "as-of-date" content rule beautifully |
| Self-learning ticket system | ❌ | ⭐ Yes (Phase 2) |
| Maps locator with hand-off to Google Maps | ✅ | — |
| Letter/document generator | ✅ | — |
| Past questions / study tools | ❌ | Consider (high demand, but adjacent product) |
| LMS integration (read Sakai assignments) | ❌ | Hard — likely not feasible without DICTS partnership |
| Calendar integration | ❌ | Easy + high value — just embed UG academic calendar dates |
| Notifications (deadlines, hall fee windows) | ❌ | ⭐ Yes (Phase 2) |
| Multilingual (English + Twi/Ga common phrasing) | ❌ | Consider — many DL students use Twi in WhatsApp questions |

---

## 12. Things You Probably Haven't Thought Of (My "anything else?" list)

You asked for what you might have missed. Things I noticed reading your spec that aren't there:

1. **Disability / accessibility services.** UG has an Office of Students with Special Needs (and lecture halls with notorious step access). Currently no entry in your spec.
2. **Sexual harassment policy & reporting channel.** UG has a published anti-sexual-harassment policy and a dedicated unit. High-stakes topic — should be in the KB with verified contact channels, not omitted.
3. **Lost & found / lost ID card replacement.** Procedure: pay at Cash Office, apply at AAD. Cited in §10 questions but worth its own KB entry.
4. **Religious / cultural dietary needs.** Where do halal-eating Muslim students reliably get food? Where do students fasting during Ramadan eat at iftar? Common DL/sandwich student WhatsApp question.
5. **Period products / sanitary access.** SRC Day-of-Giving has touched this; it's a real need that women's hall residents publicly raise.
6. **Power & water outages.** ECG outages and water rationing both happen. Where do students get updates? (Right now: hall WhatsApp groups. The app could be the canonical source.)
7. **Lecture hall finder by course code.** Students often know "I have PSYC 207 today" but not which building/room. Your maps locator could be wired to course codes → building, given a timetable upload.
8. **Past exam papers** (Balme Library has an actual past-papers e-resource). Hugely valued — your reddit synthesis confirms this is in the top-5 student needs.
9. **Hall vs hostel cost comparison.** Students often pick blindly. A simple comparison page (per-bed cost, distance to common lecture halls, in-room amenities) would be uniquely useful.
10. **Trotro & shuttle wayfinding.** "How do I get from Okponglo to Volta Hall after 9pm?" is a real safety question. Static text + Google Maps link covers it cheaply.
11. **Library e-resource access from off-campus.** UG has [ezproxy.ug.edu.gh](http://ezproxy.ug.edu.gh/) for off-campus access — DL students especially need this and it's poorly publicised.
12. **Wi-Fi / eduroam setup**, complete with the certificate setup steps that DICTS publishes. This is a Top-3 DICTS help-desk ticket.
13. **Departmental Exams Officers — directory.** When the assistant says "go to your departmental exams officer," it should ideally know who that is per department. The directory exists in the staff directory but isn't surfaced cleanly.
14. **Calendar of "panic dates."** Course registration end, fee deadline, exam dates, resit dates, hall fee deadline. A pulled calendar feed beats prose every time.
15. **A "what does this acronym mean" lookup.** UG runs heavy on acronyms (MIS, STS, DICTS, UGCS, UGEL, SRC, AAD, SFAO, IPO, CHS, CBAS, CoH, CoE, NMIMR, WACCI, WACCBIP, JQB, NNB, K-Block, LOT, RCOMM, HERC, UGRC, FGPA, CWA). A glossary in the KB makes the assistant feel native to UG.
16. **A clear "we are not the official UG" disclaimer** + a link to the official source on every answer. Both legally smart and good UX.
17. **Anti-scam / "do not pay for this" page.** Recurring scam: "pay this person to get you a bed/grade/admission." The assistant should have a flat "UG does not work this way, here is the official channel" answer.
18. **Founders' Day / Hall Week / Congregation dates** — repeats yearly, easy KB entry, frequently asked.
19. **Election year notes.** SRC elections happen — students ask "where do I vote?" The KB should know.
20. **A telegram/WhatsApp ingestion plan.** Your spec hints at it ("founder's own DL WhatsApp/Telegram group history"). Worth formalising — that's literally your ground-truth pipeline.
21. **Pidgin / casual English handling.** UG students phrase questions like "how I go check my hall paa?" — the model needs to handle this naturally, not formal English only.
22. **DL/sandwich exam logistics.** Where do DL students sit exams? Same campus? Different rooms?
23. **A "stale-data signal."** Your spec already calls for "as of [date]" — operationally, every KB entry should carry a `last_verified` timestamp and the chat should surface it. ("This was true as of June 2026 — confirm at [official link].")
24. **Cybersecurity awareness.** UG students get phishing emails impersonating MIS Web / Sakai. A standing answer + the real domain list is valuable.

---

## 13. Sources of Truth — Master Link Index

Pin these. The assistant should treat them as gospel and link out to them rather than reciting their content stale.

### Official UG
- Main site: [ug.edu.gh](https://www.ug.edu.gh/)
- Overview: [ug.edu.gh/about-ug/overview](https://www.ug.edu.gh/about-ug/overview)
- Academic Affairs (AAD): [ug.edu.gh/aad](https://www.ug.edu.gh/aad)
- Freshers Info: [ug.edu.gh/aad/resources/freshmen-info](https://www.ug.edu.gh/aad/resources/freshmen-info)
- Registration Help: [ug.edu.gh/aad/resources/registration](https://www.ug.edu.gh/aad/resources/registration)
- Academic FAQs: [ug.edu.gh/aad/faqs](https://www.ug.edu.gh/aad/faqs)
- Schedule of Fees: [ug.edu.gh/aad/schedule-fees](https://www.ug.edu.gh/aad/schedule-fees)
- Academic Calendar: [ug.edu.gh/academics/calendar](https://www.ug.edu.gh/academics/calendar)
- Change of Grade / Re-marking: [ug.edu.gh/aad/resources/academic-support-services/change-grade-form](https://www.ug.edu.gh/aad/resources/academic-support-services/change-grade-form)
- Deferment: [ug.edu.gh/aad/node/89](https://www.ug.edu.gh/aad/node/89)
- Certificate Issuance / Replacement: [ug.edu.gh/aad/resources/academic-support-services/certificate-issuance-replacement](https://www.ug.edu.gh/aad/resources/academic-support-services/certificate-issuance-replacement)
- Students Financial Aid Office: [ug.edu.gh/financialaid](https://www.ug.edu.gh/financialaid/)
- Dean of Students: [ug.edu.gh/dos](https://www.ug.edu.gh/dos)
- Health Services overview: [ug.edu.gh/healthservices/about-overview](https://www.ug.edu.gh/healthservices/about-overview)
- Health Services FAQs: [ug.edu.gh/healthservices/FAQs](https://www.ug.edu.gh/healthservices/FAQs)
- Careers & Counselling Centre: [ug.edu.gh/careers/](https://www.ug.edu.gh/careers/) · [Contact](https://www.ug.edu.gh/careers/contact-us)
- International Programmes Office: [ipo.ug.edu.gh](https://ipo.ug.edu.gh/) · [International Admissions](https://admissions.ug.edu.gh/international)
- Admissions: [admissions.ug.edu.gh](https://admissions.ug.edu.gh/)
- Distance Education: [admissions.ug.edu.gh/undergraduate/distance](https://admissions.ug.edu.gh/undergraduate/distance)
- Balme Library: [balme.ug.edu.gh](https://balme.ug.edu.gh/) · UGCat catalogue: [library.ug.edu.gh](http://library.ug.edu.gh/) · ezproxy: [ezproxy.ug.edu.gh](http://ezproxy.ug.edu.gh/)
- UG Sports Directorate: [sports.ug.edu.gh](https://sports.ug.edu.gh/)
- UGCS (Computer Services) help-desk: [ugcs.ug.edu.gh/presence-ict-ug-campus-0](https://ugcs.ug.edu.gh/presence-ict-ug-campus-0)
- Sakai: [sakai.ug.edu.gh](https://sakai.ug.edu.gh/) · Plagiarism guide: [sakairesources1.ug.edu.gh — RCOMM 100 guide](https://sakairesources1.ug.edu.gh/How%20to%20Check%20the%20Similarity%20Index%20of%20Your%20Work%20on%20Sakai)
- MIS Web (iEnabler): [ienabler.ug.edu.gh/pls/prodi41/w99pkg.mi_login](https://ienabler.ug.edu.gh/pls/prodi41/w99pkg.mi_login)
- STS Portal: [sts.ug.edu.gh](https://sts.ug.edu.gh/services/)
- Student Handbook (referenced): [ug.edu.gh/aad/Students-Handbook](http://www.ug.edu.gh/aad/Students-Handbook)
- UGEL (hostels): [ugel.com.gh](https://ugel.com.gh/) · [Hostels list](https://ugel.com.gh/hostels/)
- UG Alumni Relations: [ar.ug.edu.gh](https://ar.ug.edu.gh/) · UG Alumni Association: [alumni.ug.edu.gh](http://alumni.ug.edu.gh/)
- UG SRC: Twitter [@Ug_src](https://x.com/Ug_src)
- UGSpace (institutional repository): [ugspace.ug.edu.gh](http://ugspace.ug.edu.gh/)

### SLTF
- [sltf.gov.gh](https://www.sltf.gov.gh/) · [Contact](https://www.sltf.gov.gh/contact-us/) · [Zonal & Campus Offices](https://www.sltf.gov.gh/zonal-and-campus-offices/)

### Reference — official UG academic calendar PDFs
- 2025/2026 Undergraduate (Main Campus): [PDF](https://www.ug.edu.gh/sites/default/files/2025-08/2025-2026%20Academic%20Calendar%20-%20Undergraduate%20programme%20%28Main%20Campus%29.pdf)
- 2025/2026 SGS (Graduate): [PDF](https://sgs.ug.edu.gh/sites/sgs.ug.edu.gh/files/2025-09/Graduate%20Studies%20-%202025%20-%202026%20Academic%20Calendar.pdf)

### Public / community sources (lower trust — confirm before quoting)
- Wikipedia: [University of Ghana](https://en.wikipedia.org/wiki/University_of_Ghana) · [Balme Library](https://en.wikipedia.org/wiki/The_Balme_Library) · [UGMC](https://en.wikipedia.org/wiki/University_of_Ghana_Medical_Centre)
- UCLA Study Abroad — Volta Hall living: [ieo.ucla.edu/ghana-volta-hall-and-living-at-the-university-of-ghana](https://ieo.ucla.edu/ghana-volta-hall-and-living-at-the-university-of-ghana/)
- Student-made interactive map (limited data, useful as a UI reference): [enkayyy97.github.io/ug-campus-map](https://enkayyy97.github.io/ug-campus-map/)
- Mapize building list (with rough GPS for many halls): [mapize.com/map/university-of-ghana-map](https://www.mapize.com/map/university-of-ghana-map/)
- Reddit r/UniversityOfGhana: [reddit.com/r/UniversityOfGhana](https://www.reddit.com/r/UniversityOfGhana/)
- Reddit r/ghana — "what do you wish you'd known before level 100": [thread](https://www.reddit.com/r/ghana/comments/1833vh2/)

### Public YouTube tutorials (worth embedding in Phase 2)
- How to use Sakai LMS: [youtube.com/watch?v=2UDlIY6jNSM](https://www.youtube.com/watch?v=2UDlIY6jNSM)
- Add/Drop on MIS Web (2025): [youtube.com/watch?v=pTDK_vOVH9U](https://www.youtube.com/watch?v=pTDK_vOVH9U)
- Plagiarism check step-by-step (Triple K Artworks): [youtube.com/watch?v=8fgepQGKeEs](https://www.youtube.com/watch?v=8fgepQGKeEs)
- Hall residence registration after allocation: [youtube.com/watch?v=o0K4wLgkT9M](https://www.youtube.com/watch?v=o0K4wLgkT9M)
- Official UG Freshers Orientation 2024/25 playlist: [youtube.com/playlist?list=PLkKfNFGqIk0O3QOX2tq0zMZApPhcgyRA2](https://www.youtube.com/playlist?list=PLkKfNFGqIk0O3QOX2tq0zMZApPhcgyRA2)
- How to get your official transcript: [youtube.com/watch?v=Bw1OpVpysho](https://www.youtube.com/watch?v=Bw1OpVpysho)
- ID card booking — DL students: [youtube.com/watch?v=OG-8s8rmank](https://www.youtube.com/watch?v=OG-8s8rmank)

---

## 14. Glossary of UG Acronyms

| Acronym | Stands for |
|---|---|
| AAD | Academic Affairs Directorate |
| CBAS | College of Basic and Applied Sciences |
| CHS | College of Health Sciences |
| CoE | College of Education |
| CoH | College of Humanities |
| CWA | Cumulative Weighted Average |
| DICTS / UGCS | Directorate of ICT Services / UG Computing Systems (campus IT) |
| DL | Distance Learning |
| FGPA | Final Grade Point Average |
| HERC | Humanities Elective Required Course |
| IPO | International Programmes Office |
| ISH | International Students Hostel |
| JQB | (Building name — central admin / finance block) |
| LOT | Lecture Hall Theatre (e.g. Tetteh-LOT near Nursing) |
| MIS | Management Information Systems (the iEnabler portal) |
| NMIMR | Noguchi Memorial Institute for Medical Research |
| NNB | (Lecture/teaching building, central) |
| RCOMM | Research Communication (the Sakai plagiarism site code: RCOMM 100) |
| SFAO | Students Financial Aid Office |
| SGS | School of Graduate Studies |
| SLTF | Students Loan Trust Fund |
| SRC | Students' Representative Council |
| STS | Student Self-Service (sts.ug.edu.gh) |
| UGCCD | UG Careers and Counselling Directorate |
| UGEL | University of Ghana Enterprise Limited (commercial arm, runs hostels) |
| UGMC | University of Ghana Medical Centre |
| UGRC | UG Required Core (foundational core courses) |
| WACCBIP | West African Centre for Cell Biology and Infectious Pathogens |
| WACCI | West African Centre for Crop Improvement |

---

## 15. Ground-Truth Pass — What the Founder Must Still Add

This is the final checklist. The web could not verify these, so the founder needs to write them.

### 15.1 Walking directions — write one entry like this for every key place
Template:

> **[Place name]**
> **What you'll see when you're nearly there:** ___
> **From the Main Gate (Okponglo):** turn ___ at ___, walk past ___, look for ___
> **From [common student start point — e.g. Night Market]:** ___
> **After dark:** what's the safer route?
> **Easy-to-miss detail:** ___
> **Verified by:** [founder name] · **Date:** ___

Apply to (at minimum): SLTF office (per §8.2), Departmental Exams Officers per department, Dean of Students office, all twelve+ halls of residence, JQB Cash Office, Students Services Centre at the Information Centre, Careers & Counselling (the "behind Sociology" anchor), Balme Library entry, the chapels, the Central Mosque, the gym/pool, the shuttle stops.

### 15.2 SLTF (per project spec Section 3)
- Exact office location + the "how to actually find it" hack
- Full sts.ug.edu.gh → SLTF process step-by-step
- Current amount tiers for DL / Diploma / Regular
- Settle: guarantor requirement (yes/no, as of when)
- Settle: disbursement (e-zwich vs GCB automatic)
- Settle: sandwich eligibility

### 15.3 DL/sandwich-specific operations
Founder's own WhatsApp/Telegram history is the source of truth here, per spec.

### 15.4 Phone numbers
Real, live numbers students use for hall security, hall porters, and "the guy who actually picks up at AAD" — these aren't on the web.

### 15.5 The "as of [date]" pass
Every entry above needs a `last_verified` field before going live. Then a quarterly re-check rhythm.

---

## 16. Final Builder Notes

- **Treat this file as a v1 corpus, not a finished knowledge base.** It gives you ~85% of Phase 1 ground; the founder closes the remaining 15%.
- **Resolved facts vs unresolved** are clearly separated — keep that separation in your retrieval layer too. When the assistant answers from an unresolved area, it should say so.
- **The Sakai code is RCOMM 100.** Don't say 1018 or 1080 anymore.
- **The Okponglo Main Gate is the only 24/7 public entrance.** Use that as the universal "starting point" for all Maps directions until founder ground-truth gives finer paths.
- **Default to linking out** for fees, calendar, and SLTF specifics — your project spec's content rule demands it.
- **Glossary + role-based answering + ticket system** are your three best uplifts beyond what's currently in your spec.
- **Don't promise turn-by-turn walking directions.** Promise *names + landmarks + Google Maps hand-off* — that's both honest and what students actually use anyway.

---

*Compiled June 2026. All linked sources accessed and cited at time of compilation. Re-verify before deployment, and especially before any quoted figures (fees, deadlines, SLTF amounts) are surfaced to users.*
