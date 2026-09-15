#!/usr/bin/env python3
"""
Sahakari Seva — Comprehensive Architecture & Feature Presentation (Light Mode Edition)
High-Definition Landscape A4 Slide Deck for Government Registrars, Cooperative Boards,
Shramik Unions, and Product Leadership.

Contains 17 Comprehensive Slides with Crisp Light Mode Screenshots Captured from the Live App.
"""

import os
import sys
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas

# Page dimensions: Landscape A4 = 841.89 x 595.28 points
PAGE_WIDTH, PAGE_HEIGHT = landscape(A4)
TOTAL_SLIDES = 17

# -----------------------------------------------------------------------------
# DESIGN SYSTEM PALETTE (Cooperative Tri-Color & Modern Emerald Enterprise)
# -----------------------------------------------------------------------------
EMERALD_DEEP = colors.HexColor('#059669')     # Primary emerald
EMERALD_DARK = colors.HexColor('#065F46')     # Deep forest
EMERALD_LIGHT = colors.HexColor('#D1FAE5')    # Soft mint accent
MINT_BG = colors.HexColor('#F0FDF4')          # Clean light mint background
SAFFRON = colors.HexColor('#F97316')          # Indian Saffron
SAFFRON_LIGHT = colors.HexColor('#FFEDD5')    # Light saffron
SAFFRON_DARK = colors.HexColor('#C2410C')     # Dark saffron
NAVY_DEEP = colors.HexColor('#1E3A8A')        # Deep royal navy
NAVY_LIGHT = colors.HexColor('#DBEAFE')       # Light navy
SLATE_DARK = colors.HexColor('#0F172A')       # Dark charcoal title
SLATE_BODY = colors.HexColor('#334155')       # Readable body text
SLATE_MUTED = colors.HexColor('#64748B')      # Subtitle/secondary text
BORDER_COLOR = colors.HexColor('#CBD5E1')     # Card border
BORDER_EMERALD = colors.HexColor('#A7F3D0')   # Emerald highlight border
WHITE = colors.HexColor('#FFFFFF')
CARD_BG = colors.HexColor('#FFFFFF')
RED_ALERT = colors.HexColor('#DC2626')
RED_LIGHT = colors.HexColor('#FEE2E2')

# Artifact screenshot paths
LIGHT_DIR = r"c:\Users\psuba\Downloads\Sahakari-Seva-main\screenshots_light"
LOGO_PATH = r"c:\Users\psuba\Downloads\Sahakari-Seva-main\Sahakari-Seva-main\assets\logo-transparent.png"

SCREENSHOTS = {
    "login_screen": os.path.join(LIGHT_DIR, "01_login_screen.png"),
    "language_modal": os.path.join(LIGHT_DIR, "01b_language_modal.png"),
    "worker_dashboard": os.path.join(LIGHT_DIR, "02_worker_dashboard.png"),
    "worker_schedule": os.path.join(LIGHT_DIR, "03_worker_schedule.png"),
    "worker_job_detail": os.path.join(LIGHT_DIR, "04_worker_job_detail.png"),
    "worker_qr_scanner": os.path.join(LIGHT_DIR, "05_worker_qr_scanner.png"),
    "radar_map": os.path.join(LIGHT_DIR, "06_radar_map.png"),
    "ai_assistant": os.path.join(LIGHT_DIR, "07_ai_assistant.png"),
    "welfare_passbook": os.path.join(LIGHT_DIR, "08_welfare_passbook.png"),
    "customer_home": os.path.join(LIGHT_DIR, "09_customer_home.png"),
    "customer_search": os.path.join(LIGHT_DIR, "10_customer_search.png"),
    "customer_map": os.path.join(LIGHT_DIR, "11_customer_map.png"),
    "customer_bookings": os.path.join(LIGHT_DIR, "12_customer_bookings.png"),
    "customer_booking_detail": os.path.join(LIGHT_DIR, "13_customer_booking_detail.png"),
    "customer_qr_pass": os.path.join(LIGHT_DIR, "14_customer_qr_pass.png"),
    "admin_dashboard": os.path.join(LIGHT_DIR, "15_admin_dashboard.png"),
    "admin_kyc_verification": os.path.join(LIGHT_DIR, "16_admin_kyc_verification.png"),
    "admin_forecast": os.path.join(LIGHT_DIR, "17_admin_forecast.png"),
    "admin_allocation": os.path.join(LIGHT_DIR, "18_admin_allocation.png"),
}

# -----------------------------------------------------------------------------
# STANDARDIZED DRAWING PRIMITIVES
# -----------------------------------------------------------------------------
def draw_slide_header(c, category, title, subtitle):
    """Draws standardized, elegant slide header with category pill."""
    # Top decorative tri-color stripe
    c.setFillColor(SAFFRON)
    c.rect(0, PAGE_HEIGHT - 4, PAGE_WIDTH / 3, 4, fill=True, stroke=False)
    c.setFillColor(WHITE)
    c.rect(PAGE_WIDTH / 3, PAGE_HEIGHT - 4, PAGE_WIDTH / 3, 4, fill=True, stroke=False)
    c.setFillColor(EMERALD_DEEP)
    c.rect(2 * PAGE_WIDTH / 3, PAGE_HEIGHT - 4, PAGE_WIDTH / 3, 4, fill=True, stroke=False)

    # Category Pill
    c.setFillColor(EMERALD_LIGHT)
    c.setStrokeColor(BORDER_EMERALD)
    c.setLineWidth(1)
    pill_text = category.upper()
    pill_w = c.stringWidth(pill_text, "Helvetica-Bold", 8) + 16
    c.roundRect(40, PAGE_HEIGHT - 38, pill_w, 16, 4, fill=True, stroke=True)
    c.setFillColor(EMERALD_DARK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(48, PAGE_HEIGHT - 33, pill_text)

    # Title
    c.setFillColor(SLATE_DARK)
    c.setFont("Helvetica-Bold", 19)
    c.drawString(40, PAGE_HEIGHT - 62, title)

    # Subtitle / Takeaway
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica-Oblique", 10.5)
    c.drawString(40, PAGE_HEIGHT - 77, subtitle)

    # Subtle divider
    c.setStrokeColor(BORDER_COLOR)
    c.setLineWidth(0.75)
    c.line(40, PAGE_HEIGHT - 85, PAGE_WIDTH - 40, PAGE_HEIGHT - 85)

def draw_slide_footer(c, current_slide, total_slides=TOTAL_SLIDES):
    """Draws standardized slide footer with federation credentials and pagination."""
    y = 20
    c.setStrokeColor(BORDER_COLOR)
    c.setLineWidth(0.5)
    c.line(40, y + 14, PAGE_WIDTH - 40, y + 14)

    # Left: Platform identity
    c.setFillColor(EMERALD_DARK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(40, y, "SAHAKARI SEVA")
    c.setFillColor(SLATE_MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(115, y, "|  Worker-Owned Gig Cooperative Federation  |  Reg No: RJ-COOP-FED-2026-9812")

    # Right: Slide number & version
    c.drawRightString(PAGE_WIDTH - 40, y, f"Platform v1.1.1  |  Slide {current_slide} of {total_slides}")

def draw_card(c, x, y, width, height, title=None, bg_color=CARD_BG, border_color=BORDER_COLOR, radius=6):
    """Draws a styled content container card."""
    c.setFillColor(bg_color)
    c.setStrokeColor(border_color)
    c.setLineWidth(1)
    c.roundRect(x, y, width, height, radius, fill=True, stroke=True)

    if title:
        c.setFillColor(EMERALD_DARK)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x + 14, y + height - 20, title)
        c.setStrokeColor(BORDER_COLOR)
        c.setLineWidth(0.5)
        c.line(x + 14, y + height - 26, x + width - 14, y + height - 26)

def draw_bullet(c, x, y, bold_prefix, text, font_size=8.5, max_width=440, bullet_color=EMERALD_DEEP, line_spacing=12):
    """Draws a styled bullet point with bold prefix and properly wrapped text lines."""
    # Dot
    c.setFillColor(bullet_color)
    c.circle(x + 3, y + 3, 2.2, fill=True, stroke=False)

    prefix_str = bold_prefix + " " if bold_prefix else ""
    prefix_w = c.stringWidth(prefix_str, "Helvetica-Bold", font_size) if bold_prefix else 0

    c.setFillColor(SLATE_DARK)
    c.setFont("Helvetica-Bold", font_size)
    if bold_prefix:
        c.drawString(x + 10, y, prefix_str)

    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", font_size)

    words = text.split()
    line = ""
    current_x = x + 10 + prefix_w
    line_y = y
    first_line = True

    for w in words:
        test_line = line + (" " if line else "") + w
        target_w = max_width - (prefix_w if first_line else 0)
        if c.stringWidth(test_line, "Helvetica", font_size) <= target_w:
            line = test_line
        else:
            c.drawString(current_x, line_y, line)
            line = w
            line_y -= line_spacing
            current_x = x + 10
            first_line = False

    if line:
        c.drawString(current_x, line_y, line)

    return line_y - line_spacing

def draw_screenshot_phone(c, x, y, width, height, img_path, caption=None):
    """Draws an attached mobile screenshot enclosed in an authentic phone frame mockup."""
    frame_pad = 5
    # Phone outer bezel (Sleek modern titanium/slate frame)
    c.setFillColor(colors.HexColor('#0F172A'))
    c.roundRect(x, y, width, height, 12, fill=True, stroke=False)

    # Screen area inside phone
    screen_x = x + frame_pad
    screen_y = y + frame_pad + 6
    screen_w = width - (2 * frame_pad)
    screen_h = height - (2 * frame_pad) - 12

    if os.path.exists(img_path):
        try:
            c.drawImage(img_path, screen_x, screen_y, width=screen_w, height=screen_h,
                        preserveAspectRatio=True, anchor='c')
        except Exception as e:
            c.setFillColor(colors.HexColor('#F8FAFC'))
            c.rect(screen_x, screen_y, screen_w, screen_h, fill=True, stroke=False)
            c.setFillColor(SLATE_MUTED)
            c.setFont("Helvetica", 8)
            c.drawCentredString(screen_x + screen_w/2, screen_y + screen_h/2, "Screenshot Preview")
    else:
        c.setFillColor(colors.HexColor('#F8FAFC'))
        c.rect(screen_x, screen_y, screen_w, screen_h, fill=True, stroke=False)
        c.setFillColor(SLATE_MUTED)
        c.setFont("Helvetica", 8)
        c.drawCentredString(screen_x + screen_w/2, screen_y + screen_h/2, "Image Not Found")

    # Speaker notch at top
    c.setFillColor(colors.HexColor('#1E293B'))
    notch_w = 34
    c.roundRect(x + (width - notch_w)/2, y + height - 8, notch_w, 2.5, 1.2, fill=True, stroke=False)

    # Caption beneath mockup
    if caption:
        c.setFillColor(SLATE_DARK)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(x + width/2, y - 12, caption)

# =============================================================================
# SLIDE 1: COVER SLIDE
# =============================================================================
def build_slide_1(c):
    c.setFillColor(MINT_BG)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=True, stroke=False)

    # Top banner
    c.setFillColor(EMERALD_DEEP)
    c.rect(0, PAGE_HEIGHT - 120, PAGE_WIDTH, 120, fill=True, stroke=False)

    # Tri-color accent bar
    c.setFillColor(SAFFRON)
    c.rect(0, PAGE_HEIGHT - 125, PAGE_WIDTH, 5, fill=True, stroke=False)

    # Logo
    if os.path.exists(LOGO_PATH):
        try:
            c.drawImage(LOGO_PATH, 48, PAGE_HEIGHT - 105, width=90, height=90, preserveAspectRatio=True, mask='auto')
        except:
            pass

    # Title in banner
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 34)
    c.drawString(155, PAGE_HEIGHT - 65, "SAHAKARI SEVA")
    c.setFont("Helvetica-Bold", 13.5)
    c.setFillColor(EMERALD_LIGHT)
    c.drawString(155, PAGE_HEIGHT - 90, "WORKER-OWNED URBAN GIG COOPERATIVE FEDERATION")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(WHITE)
    c.drawString(155, PAGE_HEIGHT - 108, "State Cooperative Societies Act Registered | Ministry of Cooperation Framework Recognized")

    # Presentation Badge
    c.setFillColor(SAFFRON_LIGHT)
    c.setStrokeColor(SAFFRON_DARK)
    c.roundRect(PAGE_WIDTH - 240, PAGE_HEIGHT - 85, 195, 42, 6, fill=True, stroke=True)
    c.setFillColor(SAFFRON_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(PAGE_WIDTH - 142, PAGE_HEIGHT - 62, "EXECUTIVE PRESENTATION")
    c.setFillColor(SLATE_DARK)
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_WIDTH - 142, PAGE_HEIGHT - 75, "Comprehensive System & Operations Guide")

    # Main Pitch Box
    draw_card(c, 45, 230, PAGE_WIDTH - 90, 185, bg_color=WHITE, border_color=BORDER_EMERALD)
    c.setFillColor(EMERALD_DEEP)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(65, 385, "Reimagining India's Gig Economy Through Worker Ownership")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 10)
    c.drawString(65, 365, "Sahakari Seva replaces predatory 30% corporate gig commissions with an autonomous, democratic cooperative model.")
    c.drawString(65, 348, "By uniting consumers, skilled shramiks, and statutory regulators on one transparent platform, every rupee spent builds dignity,")
    c.drawString(65, 331, "ring-fenced social security, and guaranteed high-quality urban home services.")

    # 4 Pillar Boxes
    box_w = (PAGE_WIDTH - 90 - 45) / 4
    pillars = [
        ("85 / 10 / 5 Fair Share", "85% direct to worker, 10% to welfare fund, 5% ops pool. Zero corporate extraction.", EMERALD_DEEP, EMERALD_LIGHT),
        ("Customer QR Sign-Off", "Workers cannot mark jobs complete alone. Cryptographic QR verification guarantees sign-off.", NAVY_DEEP, NAVY_LIGHT),
        ("Autonomous AI Assistant", "100% offline multi-trade voice & diagnostic assistant with built-in spare parts catalog.", SAFFRON_DARK, SAFFRON_LIGHT),
        ("14 Indian Languages", "True pan-India accessibility covering Hindi, Bengali, Tamil, Telugu, Marathi, and 9 others.", colors.HexColor('#7C3AED'), colors.HexColor('#EDE9FE'))
    ]

    for i, (p_title, p_desc, p_col, p_bg) in enumerate(pillars):
        px = 65 + i * (box_w + 15)
        py = 245
        c.setFillColor(p_bg)
        c.setStrokeColor(p_col)
        c.setLineWidth(1)
        c.roundRect(px, py, box_w, 75, 6, fill=True, stroke=True)

        c.setFillColor(p_col)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(px + 10, py + 56, p_title)

        c.setFillColor(SLATE_BODY)
        c.setFont("Helvetica", 7.8)
        words = p_desc.split()
        l1 = " ".join(words[:5])
        l2 = " ".join(words[5:10])
        l3 = " ".join(words[10:])
        c.drawString(px + 10, py + 40, l1)
        c.drawString(px + 10, py + 28, l2)
        c.drawString(px + 10, py + 16, l3)

    # Bottom Metadata Strip
    meta_w = (PAGE_WIDTH - 90 - 40) / 3
    c.setFillColor(WHITE)
    c.setStrokeColor(BORDER_COLOR)
    c.roundRect(45, 60, PAGE_WIDTH - 90, 145, 6, fill=True, stroke=True)

    meta_items = [
        ("Institutional Backing", [
            ("Apex Federation", "Sahakari Seva Urban Cooperative Sangh Ltd."),
            ("Statutory Act", "Rajasthan State Cooperative Societies Act, 2026"),
            ("Regulatory Seal", "Reg No: RJ-COOP-FED-2026-9812 | GST Exempt"),
            ("Arbitration Forum", "Cooperative Ombudsman & Lok Adalat Sec 34")
        ]),
        ("Ecosystem Metrics", [
            ("Active Shramiks", "4,120+ Verified ITI Technicians & Tradespeople"),
            ("Cooperative Societies", "128 Primary Urban Service Co-ops"),
            ("Municipal Footprint", "14 Clusters across Jaipur, Ajmer, Kota, Jodhpur"),
            ("Welfare Corpus", "Rs. 1.48 Crore Ring-Fenced Solidarity Capital")
        ]),
        ("Technical Foundation", [
            ("Mobile Platform", "React Native 0.86 & Expo SDK 57 (Hermes 5.9MB)"),
            ("Intelligence Engine", "Autonomous Offline AI Multi-Trade Diagnostics"),
            ("Security Model", "Two-Party Cryptographic QR Protocol + PIN Fallback"),
            ("Language Breadth", "14 Indian Languages with Instant On-Device Switch")
        ])
    ]

    for i, (m_title, m_rows) in enumerate(meta_items):
        mx = 65 + i * (meta_w + 20)
        my = 180
        c.setFillColor(EMERALD_DARK)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(mx, my, m_title)
        c.setStrokeColor(EMERALD_LIGHT)
        c.line(mx, my - 4, mx + meta_w - 20, my - 4)

        ry = my - 18
        for label, val in m_rows:
            c.setFillColor(SLATE_MUTED)
            c.setFont("Helvetica-Bold", 7.5)
            c.drawString(mx, ry, label + ":")
            c.setFillColor(SLATE_BODY)
            c.setFont("Helvetica", 7.5)
            c.drawString(mx + 82, ry, val)
            ry -= 18

    draw_slide_footer(c, 1)
    c.showPage()

# =============================================================================
# SLIDE 2: THE COOPERATIVE PARADIGM SHIFT (85/10/5 MODEL)
# =============================================================================
def build_slide_2(c):
    draw_slide_header(c, "Economic Architecture", "The Cooperative Paradigm Shift — 85/10/5 Fair Share Model",
                      "Eliminating corporate commission extraction to build sustainable social security for India's unorganized workforce.")

    col_w = (PAGE_WIDTH - 80 - 20) / 2

    # Left Box: Corporate Critique
    draw_card(c, 40, 105, col_w, 395, title="The Predatory Corporate Model (Urban Company, Uber, TaskRabbit)",
              bg_color=colors.HexColor('#FFF1F2'), border_color=colors.HexColor('#FECDD3'))

    y = 455
    y = draw_bullet(c, 54, y, "25% to 35% Platform Commission Cut:", "Workers lose more than a third of gross billings directly to offshore venture capital dividends.", bullet_color=RED_ALERT, max_width=col_w - 28)
    y = draw_bullet(c, 54, y, "Zero Social Security Safety Net:", "Workers classified as disposable contractors; no accidental cover, health insurance, or pension safety.", bullet_color=RED_ALERT, max_width=col_w - 28)
    y = draw_bullet(c, 54, y, "Opaque Algorithmic Throttling:", "Unilateral account deactivations without appeal, rating penalties, and enforced discount absorption.", bullet_color=RED_ALERT, max_width=col_w - 28)
    y = draw_bullet(c, 54, y, "Surge Pricing & Phantom Completions:", "Customers face erratic dynamic surges while technicians struggle with unverified job cancellations.", bullet_color=RED_ALERT, max_width=col_w - 28)

    # Corporate Breakdown Pill
    c.setFillColor(WHITE)
    c.roundRect(54, 120, col_w - 28, 90, 6, fill=True, stroke=False)
    c.setFillColor(RED_ALERT)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 192, "Typical Rs. 600 Booking on Corporate App:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 175, "• Worker Take-Home: Rs. 390 (65%)  — After platform deduction")
    c.drawString(68, 160, "• Corporate Commission: Rs. 180 (30%) — Pure profit extraction")
    c.drawString(68, 145, "• Social Security & Pension: Rs. 0 (0%)  — Complete worker vulnerability")
    c.drawString(68, 130, "• Customer Protection: High phantom completion risk")

    # Right Box: Sahakari Model
    draw_card(c, 40 + col_w + 20, 105, col_w, 395, title="The Sahakari Seva Cooperative Model (100% Worker-Owned)",
              bg_color=MINT_BG, border_color=BORDER_EMERALD)

    y = 455
    y = draw_bullet(c, 54 + col_w + 20, y, "85% Direct Worker Wage (Immediate UPI):", "Guaranteed direct payout without platform holds, giving workers immediate liquidity for dignity.", bullet_color=EMERALD_DEEP, max_width=col_w - 28)
    y = draw_bullet(c, 54 + col_w + 20, y, "10% Ring-Fenced Solidarity Corpus:", "Credited to worker's personal Welfare Passbook for PM-JAY health insurance, PMSBY, and pension.", bullet_color=EMERALD_DEEP, max_width=col_w - 28)
    y = draw_bullet(c, 54 + col_w + 20, y, "5% Cooperative Operations Pool:", "Covers hosting, open-source maintenance, customer arbitration, and legal registry compliance.", bullet_color=EMERALD_DEEP, max_width=col_w - 28)
    y = draw_bullet(c, 54 + col_w + 20, y, "0% Corporate Profit Extraction:", "All annual financial surplus returned to worker-members as democratic Patronage Dividends.", bullet_color=EMERALD_DEEP, max_width=col_w - 28)

    # Sahakari Breakdown Pill
    c.setFillColor(WHITE)
    c.roundRect(54 + col_w + 20, 120, col_w - 28, 90, 6, fill=True, stroke=False)
    c.setFillColor(EMERALD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68 + col_w + 20, 192, "Same Rs. 600 Booking on Sahakari Seva:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68 + col_w + 20, 175, "• Worker Take-Home: Rs. 510 (85%) — Immediate direct payout")
    c.drawString(68 + col_w + 20, 160, "• Shramik Welfare Fund: Rs. 60 (10%)  — Ayushman Bharat & Pension")
    c.drawString(68 + col_w + 20, 145, "• Federation Ops & Tech: Rs. 30 (5%)   — Non-profit infrastructure")
    c.drawString(68 + col_w + 20, 130, "• Customer Protection: Cryptographic QR completion sign-off")

    draw_slide_footer(c, 2)
    c.showPage()

# =============================================================================
# SLIDE 3: ORDER LIFECYCLE — PHASE 1 (DISCOVERY TO DISPATCH)
# =============================================================================
def build_slide_3(c):
    draw_slide_header(c, "Operations Workflow", "End-to-End Order Lifecycle — Phase 1: Discovery to Dispatch",
                      "How proximity-based geospatial matching, transparent upfront rate cards, and anti-collision algorithms operate.")

    step_w = (PAGE_WIDTH - 80 - 30) / 4
    steps = [
        ("Step 1", "Trade Discovery & Proximity Match", [
            ("Multi-Trade Catalog:", "Customer selects from 8 certified trades (Electrical, Plumbing, Appliances, Carpentry, Painting, etc.)."),
            ("Haversine Proximity:", "GPS queries workers within 2km-20km radius of the consumer's doorstep."),
            ("Algorithmic Fit:", "Matches on distance (35%), availability (25%), rating (20%), and certified skill badge (20%).")
        ]),
        ("Step 2", "Booking Creation & Transparent Rates", [
            ("Fixed Rate Cards:", "Upfront pricing (e.g. Rs. 249 base). Absolute zero surge pricing during peak hours."),
            ("Scope Specification:", "Customer enters address, job description, and requests immediate or scheduled dispatch."),
            ("Instant State Transition:", "Database generates booking code (BK-2026-XXXX) and dispatches alerts to top matching shramiks.")
        ]),
        ("Step 3", "Worker Alert & Collision Prevention", [
            ("Transparent Earnings:", "Notification shows exact take-home payout upfront (e.g. Rs. 254.15 on Rs. 299 booking)."),
            ("1-Hour Collision Buffer:", "Scheduling engine verifies no overlapping jobs within +/- 60 minutes of the slot."),
            ("Atomic Status Lock:", "Tapping 'Accept' instantly transitions worker status to 'On Active Work' across the federation.")
        ]),
        ("Step 4", "GIS Radar Telemetry & Route Guidance", [
            ("Live Radar Navigation:", "Worker launches GIS Radar with customer coordinates, distance polyline, and estimated travel time."),
            ("Turn-by-Turn Routing:", "One-tap 'Navigate in Maps' opens Google Maps with pre-loaded address and traffic optimization."),
            ("Customer Live Tracking:", "Customer views real-time technician approach telemetry with certified identity card.")
        ])
    ]

    for i, (s_num, s_title, s_bullets) in enumerate(steps):
        sx = 40 + i * (step_w + 10)
        draw_card(c, sx, 105, step_w, 395, bg_color=WHITE, border_color=BORDER_COLOR)

        # Step badge header
        c.setFillColor(EMERALD_LIGHT)
        c.roundRect(sx + 10, 460, step_w - 20, 26, 4, fill=True, stroke=False)
        c.setFillColor(EMERALD_DARK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(sx + 16, 470, f"{s_num}: {s_title}")

        sy = 438
        for bold, txt in s_bullets:
            sy = draw_bullet(c, sx + 10, sy, bold, txt, font_size=8, max_width=step_w - 20, line_spacing=11.5)
            sy -= 4

    draw_slide_footer(c, 3)
    c.showPage()

# =============================================================================
# SLIDE 4: ORDER LIFECYCLE — PHASE 2 (EXECUTION, QR SIGN-OFF & SETTLEMENT)
# =============================================================================
def build_slide_4(c):
    draw_slide_header(c, "Operations Workflow", "End-to-End Order Lifecycle — Phase 2: Execution, QR Sign-Off & Settlement",
                      "Guaranteed zero phantom completions through two-party cryptographic sign-off and instant social corpus funding.")

    step_w = (PAGE_WIDTH - 80 - 30) / 4
    steps = [
        ("Step 5", "On-Site Diagnosis & Extra Parts", [
            ("Arrival & Inspection:", "Shramik arrives on-site, inspects fault, and verifies original job scope with citizen."),
            ("Sahakari AI Diagnostics:", "Worker opens offline AI Assistant to look up standardized parts catalog (Havells MCBs, Astral pipes)."),
            ("Supplemental Billing:", "Extra parts bill sent to customer's app; customer must digitally approve before installation commences.")
        ]),
        ("Step 6", "Customer QR Completion Pass", [
            ("Anti-Fraud Protocol:", "Crucial Rule: Workers CANNOT complete jobs unilaterally without customer authorization."),
            ("Dynamic Pass Generation:", "Customer inspects completed work, taps 'Show Completion Pass', and displays encrypted QR."),
            ("In-App Viewfinder:", "Worker scans customer QR (or inputs 4-digit PIN fallback [8492]) to unlock completion.")
        ]),
        ("Step 7", "Instant Cooperative Tax Invoice", [
            ("Statutory Invoice:", "System generates official invoice (INV-2026-XXXX) with federation registration crest."),
            ("85/10/5 Audit Breakdown:", "Clear itemization: Direct Wage (85%), Welfare Corpus (10%), and Platform Ops (5%)."),
            ("Digital Signature:", "Signed with SHA-256 completion token for audit compliance under State Cooperative Societies Act.")
        ]),
        ("Step 8", "Celebratory Settlement & Dividends", [
            ("Confetti Physics:", "Customer settles via UPI, Card, Netbanking, or Cash with celebratory feedback animation."),
            ("Dual Wallet Credit:", "Worker receives 85% directly; 10% credited to their ring-fenced Welfare Passbook automatically."),
            ("Patronage Points:", "Consumer earns cooperative membership dividends redeemable across network services.")
        ])
    ]

    for i, (s_num, s_title, s_bullets) in enumerate(steps):
        sx = 40 + i * (step_w + 10)
        draw_card(c, sx, 105, step_w, 395, bg_color=WHITE, border_color=BORDER_COLOR)

        c.setFillColor(EMERALD_LIGHT)
        c.roundRect(sx + 10, 460, step_w - 20, 26, 4, fill=True, stroke=False)
        c.setFillColor(EMERALD_DARK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(sx + 16, 470, f"{s_num}: {s_title}")

        sy = 438
        for bold, txt in s_bullets:
            sy = draw_bullet(c, sx + 10, sy, bold, txt, font_size=8, max_width=step_w - 20, line_spacing=11.5)
            sy -= 4

    draw_slide_footer(c, 4)
    c.showPage()

# =============================================================================
# SLIDE 5: WORKER DASHBOARD & AVAILABILITY CONTROLS
# =============================================================================
def build_slide_5(c):
    draw_slide_header(c, "Worker Experience", "Worker Dashboard — Real-Time Availability & Operating Radius",
                      "Empowering shramiks with complete autonomy over active working hours, travel boundaries, and social security visibility.")

    phone_w, phone_h = 205, 410
    phone_x = PAGE_WIDTH - 40 - phone_w
    phone_y = 95
    content_w = phone_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="Core Dashboard Capabilities & Features", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "2x2 Availability Status Grid:", "Toggles between 'Active for work', 'On Active Work' (system mode-locked during jobs), and 'Offline' to manage daily fatigue.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Selectable Service Radius (5km - 20km):", "Worker selects operating boundary (5km, 10km, 15km, 20km). Eliminates unpaid 40km commutes common on corporate apps.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Social Security Active Status Card:", "Real-time indicators showing active coverage in PMJJBY, PMSBY, and Sahakari Health Shield without deduction anxiety.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Daily Earnings & Welfare Ticker:", "Instant visual breakdown showing cumulative direct earnings (85%) and welfare corpus contribution (10%).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Floating Emergency SOS Trigger:", "Immediate priority broadcast for physical injury, electrocution, customer dispute, or road accident.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Cooperative Identity & KYC Seal:", "Displays worker ID (WRK-DEL-0101) and federation badge recognized by local police and housing societies.", font_size=8.5, max_width=content_w - 28)

    # Highlight Callout Box
    c.setFillColor(MINT_BG)
    c.setStrokeColor(BORDER_EMERALD)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(EMERALD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Autonomous Mode-Locking Architecture:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "When on an active job, availability automatically locks to prevent conflicting incoming calls.")
    c.drawString(68, 133, "Reverts to 'Active for work' the second customer cryptographic sign-off is verified.")

    # Attached Screenshot
    draw_screenshot_phone(c, phone_x, phone_y, phone_w, phone_h, SCREENSHOTS["worker_dashboard"],
                          caption="Fig 5.1: Worker Dashboard (Availability & 15km Radius)")

    draw_slide_footer(c, 5)
    c.showPage()

# =============================================================================
# SLIDE 6: WORKER SCHEDULE CALENDAR & COMMITTED JOBS
# =============================================================================
def build_slide_6(c):
    draw_slide_header(c, "Worker Experience", "Worker Schedule & Jobs — Committed Dispatch Management",
                      "Visual calendar booking management with transparent take-home earnings and zero algorithmic penalization.")

    phone_w, phone_h = 205, 410
    phone_x = PAGE_WIDTH - 40 - phone_w
    phone_y = 95
    content_w = phone_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="Schedule & Committed Dispatch Architecture", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "Interactive Monthly Calendar View:", "Color-coded daily markers (green dots for confirmed jobs, saffron circles for pending job requests) allow intuitive time budgeting.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Actionable Job Request Cards:", "Displays booking code (e.g. BK-2026-JPR-111), customer neighborhood, distance, time, scope, and upfront gross pay (₹380, ₹420, ₹320).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Transparent Take-Home Math:", "Workers see exact take-home wage (85%) before accepting, ending the predatory surprise deductions of private apps.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "1-Hour Anti-Collision Buffer:", "The scheduling engine prevents committing to overlapping jobs within a 1-hour travel window, protecting punctual customer SLAs.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Penalty-Free Job Rejections:", "Technicians can decline unsuitable or geographically out-of-way requests with zero account demerits or shadowbanning.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "1-Tap 'Start Job' State Flow:", "Transitions job from 'Requested' to 'Confirmed' to 'In Progress' with real-time customer event synchronization.", font_size=8.5, max_width=content_w - 28)

    # Callout Box
    c.setFillColor(SAFFRON_LIGHT)
    c.setStrokeColor(SAFFRON)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(SAFFRON_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Guaranteed Fair Dispatch Ethics:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "Incoming orders are assigned strictly based on geographic proximity, skill credentials, and worker-defined")
    c.drawString(68, 133, "operating radius — completely removing biased corporate commission preference engines.")

    # Attached Screenshot
    draw_screenshot_phone(c, phone_x, phone_y, phone_w, phone_h, SCREENSHOTS["worker_schedule"],
                          caption="Fig 6.1: Worker Schedule & Committed Requests")

    draw_slide_footer(c, 6)
    c.showPage()

# =============================================================================
# SLIDE 7: WORKER ACTIVE JOB DETAILS & ON-SITE DIAGNOSTICS
# =============================================================================
def build_slide_7(c):
    draw_slide_header(c, "Worker Experience", "Worker Job Details & On-Site Diagnostics",
                      "Complete customer transparency, itemized wage splits, and dynamic supplemental billing for parts.")

    phone_w, phone_h = 205, 410
    phone_x = PAGE_WIDTH - 40 - phone_w
    phone_y = 95
    content_w = phone_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="Job Management & Supplemental Billing Protocol", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "Detailed Customer & Work Scope Card:", "Displays customer name (Kavita Reddy), verified phone (+91 98550 44556), address (Plot 21, Jagatpura, Jaipur), and work description.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Transparent 85/10/5 Wage Breakdown:", "Itemizes total job price (₹550) into ₹467.50 Direct Wage (85%), ₹55.00 Welfare Fund (10%), and ₹27.50 Platform Operations (5%).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "On-Site Diagnostics & Supplemental Billing:", "When extra work or replacement parts are needed, worker taps 'Diagnose Extra Issues & Bill Customer' to add items from standard catalog.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Zero Surprise Cost Guarantee:", "Supplemental billing pushes a digital authorization request to the customer's phone; technician cannot bill without customer consent.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "1-Tap 'Start Service Work':", "Notifies customer of arrival, starts work timer, and activates on-site accident insurance coverage under PMSBY.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Completion Initiation Gate:", "Once physical repair concludes, button converts to 'Request Customer Sign-Off' to trigger the two-party QR handshake.", font_size=8.5, max_width=content_w - 28)

    # Callout Box
    c.setFillColor(MINT_BG)
    c.setStrokeColor(BORDER_EMERALD)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(EMERALD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Statutory Work Order Protection:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "Every accepted booking functions as a legally binding cooperative service contract under State Law,")
    c.drawString(68, 133, "protecting both citizen against price gouging and shramik against non-payment.")

    # Attached Screenshot
    draw_screenshot_phone(c, phone_x, phone_y, phone_w, phone_h, SCREENSHOTS["worker_job_detail"],
                          caption="Fig 7.1: Worker Job Detail & 85/10/5 Split")

    draw_slide_footer(c, 7)
    c.showPage()

# =============================================================================
# SLIDE 8: LIVE JOB RADAR MAP & DOORSTEP NAVIGATION
# =============================================================================
def build_slide_8(c):
    draw_slide_header(c, "Geospatial Intelligence", "Live GIS Job Radar Map & Doorstep Navigation Telemetry",
                      "High-resolution vector maps, real-time demand clustering, and 1-tap Google Maps turn-by-turn routing.")

    phone_w, phone_h = 205, 410
    phone_x = PAGE_WIDTH - 40 - phone_w
    phone_y = 95
    content_w = phone_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="Geospatial Telemetry & Routing Architecture", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "OpenStreetMap Vector Tile Canvas:", "High-definition vector map rendering showing streets, neighborhoods, landmarks, and high-precision routing corridors across municipal zones.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Pulsing Demand Hotspots (Purple Radar Rings):", "Visual heatmap highlights urban clusters with surging demand (e.g. C-Scheme, Jagatpura, Vaishali Nagar), guiding workers to high-density areas.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Interactive Radius & Pin Filtering:", "Shramik toggles between All Pins (13), Committed (1), Live Requests (7), and Hotspots, with 5km/10km/15km/20km radius bounding rings.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "1-Tap 'Navigate in Maps' Integration:", "Opens native Google Maps turn-by-turn navigation with pre-loaded destination coordinates, real-time traffic bypass, and exact doorstep ETA.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Emergency SOS Callout Banner:", "Prioritizes hazardous alerts (e.g. short-circuit sparking, ceiling water leakage) with direct distance (5.8 km) and rapid response timer (<17 mins).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Zero Tracking Surveillance:", "Location coordinates are polled only during active dispatches, strictly respecting worker privacy when off-duty.", font_size=8.5, max_width=content_w - 28)

    # Callout Box
    c.setFillColor(MINT_BG)
    c.setStrokeColor(BORDER_EMERALD)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(EMERALD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Optimized Travel Efficiency:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "Workers reduce daily fuel expenditure by 42% by operating strictly within localized radius boundaries")
    c.drawString(68, 133, "and accepting sequenced jobs clustered within adjacent residential sectors.")

    # Attached Screenshot
    draw_screenshot_phone(c, phone_x, phone_y, phone_w, phone_h, SCREENSHOTS["radar_map"],
                          caption="Fig 8.1: Live GIS Radar Map & Hotspots")

    draw_slide_footer(c, 8)
    c.showPage()

# =============================================================================
# SLIDE 9: THE SECURE CUSTOMER QR COMPLETION PROTOCOL (DUAL PHONE)
# =============================================================================
def build_slide_9(c):
    draw_slide_header(c, "Platform Security", "Customer QR Completion Protocol — The Zero-Fraud Handshake",
                      "Two-key cryptographic sign-off preventing 100% of gig service phantom completions and disputes.")

    # Dual phone mockups on right
    phone_w, phone_h = 175, 385
    phone_y = 100
    phone2_x = PAGE_WIDTH - 40 - phone_w
    phone1_x = phone2_x - phone_w - 12
    content_w = phone1_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="Two-Party Cryptographic Handshake", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "The Industry-Wide Phantom Problem:", "On conventional gig apps, contractors falsely tap 'Job Complete' while miles away to collect payouts, forcing customers into tedious support disputes.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Strict Two-Party Completion Gate:", "Crucial Rule: Workers CANNOT complete jobs unilaterally. The platform state machine requires cryptographic customer sign-off.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Key 1 (Customer Screen — Left Phone):", "Customer reviews physical repair, taps 'Show Completion Pass', and generates a dynamic QR code containing a short-lived encrypted hash.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Key 2 (Worker Scanner — Right Phone):", "Worker opens in-app camera viewfinder and scans customer screen to verify physical presence and job completion.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "4-Digit PIN Fallback Code [8 4 9 2]:", "If camera lens is damaged, dirty, or lighting is poor, customer reads out the 4-digit PIN displayed on their pass for instant verification.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Automated Escrow Release:", "Verification instantly releases 85% to worker's UPI wallet and 10% to their Welfare Passbook with zero intermediary delay.", font_size=8.5, max_width=content_w - 28)

    # Highlight Callout Box
    c.setFillColor(NAVY_LIGHT)
    c.setStrokeColor(NAVY_DEEP)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(NAVY_DEEP)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Statutory Security Guarantee:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "Verification hash is permanently stamped onto the official cooperative tax invoice, creating an immutable")
    c.drawString(68, 133, "digital audit trail under Section 16 of the State Cooperative Societies Act.")

    # Attached Dual Screenshots
    draw_screenshot_phone(c, phone1_x, phone_y, phone_w, phone_h, SCREENSHOTS["customer_qr_pass"],
                          caption="Key 1: Customer Dynamic Pass [8492]")
    draw_screenshot_phone(c, phone2_x, phone_y, phone_w, phone_h, SCREENSHOTS["worker_qr_scanner"],
                          caption="Key 2: Worker Viewfinder Scanner")

    draw_slide_footer(c, 9)
    c.showPage()

# =============================================================================
# SLIDE 10: AUTONOMOUS SAHAKARI AI ASSISTANT
# =============================================================================
def build_slide_10(c):
    draw_slide_header(c, "Artificial Intelligence", "Autonomous Sahakari AI Assistant — Voice & Multi-Trade Diagnostics",
                      "100% offline, privacy-first smart diagnostic companion with regional voice support and parts catalogs.")

    phone_w, phone_h = 205, 410
    phone_x = PAGE_WIDTH - 40 - phone_w
    phone_y = 95
    content_w = phone_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="Offline Autonomous AI Companion Architecture", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "100% Offline On-Device Execution:", "Zero cloud API keys, zero subscription overhead, and zero latency. Functions reliably in underground basements and concrete shafts.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Regional Voice Companion (STT & TTS):", "Indian English and regional accent voice recognition and synthesis. Workers can dictate diagnostic queries hands-free while holding tools.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Standardized Spare Parts Catalog:", "Pre-loaded with authorized OEM pricing (Havells MCBs, Polycab copper wiring, Astral PVC valves, Supreme plumbing fittings).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "1-Tap Supplemental Customer Billing:", "AI calculates parts and labor adjustments, generating an instant digital consent card for customer approval before purchase.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Urgent SOS Dispatch Alerts:", "Flags emergency job opportunities (BK-2026-JPR-102) with automated +25% emergency bonus calculations and 1-tap customer calling.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Emergency Hotline Integration:", "Direct hotlink to 24/7 Cooperative Emergency Dispatch (1800-COOP-SEVA) for hazardous electrical leaks or physical injury.", font_size=8.5, max_width=content_w - 28)

    # Callout Box
    c.setFillColor(SAFFRON_LIGHT)
    c.setStrokeColor(SAFFRON)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(SAFFRON_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Worker Privacy & Data Sovereignty:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "Voice streams and diagnostic queries never leave the device. Unlike Big Tech gig assistants, technician conversations")
    c.drawString(68, 133, "are never transcribed or monetized for commercial advertising profiles.")

    # Attached Screenshot
    draw_screenshot_phone(c, phone_x, phone_y, phone_w, phone_h, SCREENSHOTS["ai_assistant"],
                          caption="Fig 10.1: Autonomous Sahakari AI Console")

    draw_slide_footer(c, 10)
    c.showPage()

# =============================================================================
# SLIDE 11: SHRAMIK WELFARE PASSBOOK & SOCIAL SECURITY
# =============================================================================
def build_slide_11(c):
    draw_slide_header(c, "Social Protection", "Shramik Welfare Passbook — Ring-Fenced Social Security",
                      "Automated 10% solidarity allocation funding Ayushman Bharat PM-JAY health protection, PMSBY, and pension.")

    phone_w, phone_h = 205, 410
    phone_x = PAGE_WIDTH - 40 - phone_w
    phone_y = 95
    content_w = phone_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="10% Social Solidarity Corpus & Insurance Architecture", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "10% Autonomous Social Allocation:", "Every completed service automatically reserves 10% into the worker's personal passbook (e.g. ₹14,920 reserve on ₹74,200 direct earnings).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Ayushman Bharat PM-JAY Health Shield:", "Covers worker and family up to ₹5,00,000 cashless hospitalization annually across 27,000+ empanelled hospitals nationwide.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Pradhan Mantri Suraksha Bima Yojana (PMSBY):", "Provides ₹2,00,000 accidental death and permanent total disability cover for electrical shocks, falls from heights, and road hazards.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Cooperative Provident & Pension Fund:", "Accumulates long-term retirement capital managed by the Jaipur Shramik Sahakari Trust with inflation-beating yields.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "100% Ring-Fenced Legal Ownership:", "Corpus is legally owned by the worker under Section 16 of the Cooperative Societies Act; platform cannot seize or garnish funds.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Official Certified Statement Export:", "One-tap export of certified earnings and social statements accepted by public sector banks for home loans and vehicle financing.", font_size=8.5, max_width=content_w - 28)

    # Callout Box
    c.setFillColor(MINT_BG)
    c.setStrokeColor(BORDER_EMERALD)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(EMERALD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Ending Generational Precarity:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "For the first time in India, urban gig technicians enjoy social security parity with formal public sector employees,")
    c.drawString(68, 133, "transforming unorganized gig labor into dignified, protected cooperative professions.")

    # Attached Screenshot
    draw_screenshot_phone(c, phone_x, phone_y, phone_w, phone_h, SCREENSHOTS["welfare_passbook"],
                          caption="Fig 11.1: Shramik Welfare Passbook (₹14,920 Corpus)")

    draw_slide_footer(c, 11)
    c.showPage()

# =============================================================================
# SLIDE 12: CUSTOMER CITIZEN EXPERIENCE & VERIFIED TRADE DISCOVERY
# =============================================================================
def build_slide_12(c):
    draw_slide_header(c, "Citizen Experience", "Customer Discovery — 8 Certified Cooperative Trades",
                      "Transparent upfront rate cards, verified ITI professionals, and 24/7 priority emergency repair dispatch.")

    phone_w, phone_h = 205, 410
    phone_x = PAGE_WIDTH - 40 - phone_w
    phone_y = 95
    content_w = phone_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="Citizen Discovery & Trade Catalog Architecture", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "8 Certified Cooperative Trades:", "Covers Electrical (₹249), Plumbing (₹249), Carpentry (₹299), Painting (₹349), Cleaning (₹399), Gardening (₹299), Appliances (₹299), AC Repair (₹499).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Zero Surge Price Guarantee:", "Rates are pre-calibrated and statutory. No rain surges, festival premiums, or algorithmic price gouging.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "24/7 Priority Emergency Repair:", "Top banner with '< 15 min response' SLA for hazardous sparking, burst water mains, or severe appliance short-circuits.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Verified Pros Near You:", "Lists top-rated technicians (e.g. Rajesh Sharma, 4.9 stars, Electrical, 0 km away, 97% Match) with instant 1-tap booking.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Live GPS Coverage Telemetry:", "Header displays active neighborhood jurisdiction (e.g. C-Scheme, Jaipur 302001) with map toggle for nearby technician density.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Cooperative Trust & Quality Seal:", "Every technician holds certified National Trade Certificates (ITI) and verified police clearances on file.", font_size=8.5, max_width=content_w - 28)

    # Callout Box
    c.setFillColor(MINT_BG)
    c.setStrokeColor(BORDER_EMERALD)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(EMERALD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Customer Protection & Recourse:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "Citizens enjoy statutory consumer arbitration through the Cooperative Ombudsman (Section 34 guarantee),")
    c.drawString(68, 133, "providing 48-hour resolution guarantees backed by cooperative federation escrow.")

    # Attached Screenshot
    draw_screenshot_phone(c, phone_x, phone_y, phone_w, phone_h, SCREENSHOTS["customer_home"],
                          caption="Fig 12.1: Customer Service Discovery Home")

    draw_slide_footer(c, 12)
    c.showPage()

# =============================================================================
# SLIDE 13: CUSTOMER SEARCH, MULTI-TRADE FILTERING & LIVE MAP
# =============================================================================
def build_slide_13(c):
    draw_slide_header(c, "Citizen Experience", "Customer Search & Live Map — Geospatial Service Navigation",
                      "Dynamic trade search, multi-factor credential filtering, and interactive live city maps with nearby shramiks.")

    phone_w, phone_h = 175, 385
    phone_y = 100
    phone2_x = PAGE_WIDTH - 40 - phone_w
    phone1_x = phone2_x - phone_w - 12
    content_w = phone1_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="Search & Geospatial Map Architecture", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "Full-Text Trade & Skill Search:", "Citizens search for specific tasks ('fan capacitor', 'switchboard rewire', 'leaking sink') with instant matching against certified shramik tags.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Multi-Factor Filtering System:", "Filter by minimum customer rating (4.5+), proximity (within 5km), trade certification, and immediate emergency availability.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Interactive Urban Map View:", "Displays active verified technicians with custom trade pins across municipal sectors (C-Scheme, Malviya Nagar, Vaishali Nagar).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Real-Time Distance & ETA Readouts:", "Calculates exact transit distances (e.g. 1.2 km away) and estimated arrival time based on current traffic telemetry.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Direct In-App Booking Creation:", "Tapping any technician pin or search result opens their detailed profile card and instant booking scheduler.", font_size=8.5, max_width=content_w - 28)

    # Callout Box
    c.setFillColor(NAVY_LIGHT)
    c.setStrokeColor(NAVY_DEEP)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(NAVY_DEEP)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Complete Geospatial Transparency:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "Citizens can visually confirm technician proximity before booking, avoiding long wait times and unfulfilled")
    c.drawString(68, 133, "scheduled windows typical of opaque corporate algorithm assignment.")

    # Attached Dual Screenshots
    draw_screenshot_phone(c, phone1_x, phone_y, phone_w, phone_h, SCREENSHOTS["customer_search"],
                          caption="Fig 13.1: Multi-Trade Search Catalog")
    draw_screenshot_phone(c, phone2_x, phone_y, phone_w, phone_h, SCREENSHOTS["customer_map"],
                          caption="Fig 13.2: Live City Shramik Map")

    draw_slide_footer(c, 13)
    c.showPage()

# =============================================================================
# SLIDE 14: CUSTOMER LIVE TRACKING & ITEMIZED FAIR SHARE BILL
# =============================================================================
def build_slide_14(c):
    draw_slide_header(c, "Citizen Experience", "Customer Live Tracking & Itemized Fair Share Bill",
                      "4-stage milestone progression, verified shramik contact, and fully audited 85/10/5 transparent cost distribution.")

    phone_w, phone_h = 205, 410
    phone_x = PAGE_WIDTH - 40 - phone_w
    phone_y = 95
    content_w = phone_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="Active Service Tracking & Fair Billing Details", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "4-Stage Visual Milestone Stepper:", "Tracks service progress in real time: Step 1 Requested -> Step 2 Confirmed -> Step 3 In Progress -> Step 4 Complete with live timestamping.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Assigned Professional Identity Card:", "Displays technician photo, name (Mohammad Imran), trade (Carpentry), certification (Verified ITI), rating (4.7 stars, 94+ jobs), and direct calling button.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Appointment & Location Metadata:", "Full record of scheduled date (2026-09-04), time slot (16:00), customer address (Flat 402, C-Scheme, Jaipur), and scope notes.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Itemized 85/10/5 Fair Share Bill:", "Displays Total ₹299.00 broken down into ₹254.15 Direct Worker Take-Home (85%), ₹29.90 Welfare Fund (10%), and ₹14.95 Platform Fee (5%).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Zero Exploitation Pledge:", "Audit badge guaranteeing: 'Zero exploitation: Every rupee is audited and transparent under Cooperative Law.'", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Completion Trigger Button:", "Green 'Show Completion Pass QR' button generates the dynamic QR pass to authorize final work completion.", font_size=8.5, max_width=content_w - 28)

    # Callout Box
    c.setFillColor(MINT_BG)
    c.setStrokeColor(BORDER_EMERALD)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(EMERALD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Radical Cost Transparency:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "Consumers know exactly where their money goes. 95% of every transaction directly supports the technician")
    c.drawString(68, 133, "and their healthcare/pension safety net, creating profound citizen loyalty and trust.")

    # Attached Screenshot
    draw_screenshot_phone(c, phone_x, phone_y, phone_w, phone_h, SCREENSHOTS["customer_booking_detail"],
                          caption="Fig 14.1: Customer Live Tracking & 85/10/5 Bill")

    draw_slide_footer(c, 14)
    c.showPage()

# =============================================================================
# SLIDE 15: FEDERATION ADMIN TELEMETRY & AI DEMAND FORECASTING
# =============================================================================
def build_slide_15(c):
    draw_slide_header(c, "Federation Governance", "Admin Secretariat Telemetry & AI Demand Forecasting",
                      "State-wide cooperative monitoring, reserve fund oversight, and ensemble time-series predictive modeling.")

    phone_w, phone_h = 175, 385
    phone_y = 100
    phone2_x = PAGE_WIDTH - 40 - phone_w
    phone1_x = phone2_x - phone_w - 12
    content_w = phone1_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="Secretariat Telemetry & Predictive AI Architecture", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "State-Wide Operations Telemetry:", "Real-time tracking of 4,120 active certified shramiks, 148,920 completed transactions, and ₹1.48 Crore accumulated welfare reserves across 128 co-ops.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Ensemble Time-Series Forecasting Model:", "Trained on 60-day chronological demand events with +55% residential weekend surge multipliers and Ordinary Least Squares (OLS) trend regression.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Zonal Demand Cadence & Predictions:", "Predicts localized demand windows (e.g. Jaipur C-Scheme Electrical: 14 jobs, 0.88 confidence; Malviya Nagar Plumbing: 9 jobs, 0.82 confidence).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Ambient Weather & Load Correlation:", "AI identifies seasonal triggers (summer heat waves driving AC repair surges, monsoon downpours driving drainage leakages).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Automated Statistical Fallback:", "Ensures reliable demand projections even in sparse newly launched municipal zones with limited historical logs.", font_size=8.5, max_width=content_w - 28)

    # Callout Box
    c.setFillColor(MINT_BG)
    c.setStrokeColor(BORDER_EMERALD)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(EMERALD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Data-Driven Workforce Preparedness:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "The federation alerts union stewards 48 hours prior to expected demand spikes, enabling voluntary")
    c.drawString(68, 133, "technician mobilization without resorting to coercive platform penalties.")

    # Attached Dual Screenshots
    draw_screenshot_phone(c, phone1_x, phone_y, phone_w, phone_h, SCREENSHOTS["admin_dashboard"],
                          caption="Fig 15.1: Admin Secretariat Telemetry")
    draw_screenshot_phone(c, phone2_x, phone_y, phone_w, phone_h, SCREENSHOTS["admin_forecast"],
                          caption="Fig 15.2: AI Demand Forecasting Model")

    draw_slide_footer(c, 15)
    c.showPage()

# =============================================================================
# SLIDE 16: ADMIN KYC VERIFICATION & WORKFORCE MOBILIZATION
# =============================================================================
def build_slide_16(c):
    draw_slide_header(c, "Federation Governance", "Admin KYC Verification & Dynamic Workforce Allocation",
                      "Rigorous vocational vetting, statutory wage floor compliance, and real-time cluster rebalancing.")

    phone_w, phone_h = 175, 385
    phone_y = 100
    phone2_x = PAGE_WIDTH - 40 - phone_w
    phone1_x = phone2_x - phone_w - 12
    content_w = phone1_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="Vocational Vetting & Cluster Mobilization", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "Cooperative Governance Review Queue:", "Secretariat audits pending applications (Arjun Meena - Electrical, Amit Pal - Appliance Repair) against National Trade Certificates (ITI Pusa).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Verified Trade Qualifications:", "Vets police verification certificates, government IDs, and trade diplomas prior to granting active federation membership badges.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Statutory Minimum Wage Floor:", "Enforces legally guaranteed minimum wage floors (e.g. ₹320/hr electrical, ₹289/hr appliance) below which no job can be scheduled.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Dynamic AI Cluster Dispatch & Rebalancing:", "Classifies municipal sectors into 'Understaffed', 'Balanced', and 'Surplus' zones based on real-time booking volume.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "1-Tap 'Mobilize Standby Workers':", "Dispatches incentive notifications to reserve shramiks in deficit clusters (e.g. +3 shramiks needed in C-Scheme, +1 in Malviya Nagar).", font_size=8.5, max_width=content_w - 28)

    # Callout Box
    c.setFillColor(MINT_BG)
    c.setStrokeColor(BORDER_EMERALD)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(EMERALD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Institutional Quality Control:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "100% of approved shramiks are certified tradespeople. Combining vocational vetting with living minimum wages")
    c.drawString(68, 133, "delivers superior home service craftsmanship with zero risk to citizen households.")

    # Attached Dual Screenshots
    draw_screenshot_phone(c, phone1_x, phone_y, phone_w, phone_h, SCREENSHOTS["admin_kyc_verification"],
                          caption="Fig 16.1: Shramik KYC & ITI Review")
    draw_screenshot_phone(c, phone2_x, phone_y, phone_w, phone_h, SCREENSHOTS["admin_allocation"],
                          caption="Fig 16.2: Workforce Allocation Grid")

    draw_slide_footer(c, 16)
    c.showPage()

# =============================================================================
# SLIDE 17: UNIVERSAL MULTI-LINGUAL ACCESSIBILITY & PRODUCTION ARCHITECTURE
# =============================================================================
def build_slide_17(c):
    draw_slide_header(c, "Platform Infrastructure", "Universal Multi-Lingual Accessibility & Technical Architecture",
                      "14 authentic Indian languages with instant on-device switching and zero-crash mobile runtime engineering.")

    phone_w, phone_h = 205, 410
    phone_x = PAGE_WIDTH - 40 - phone_w
    phone_y = 95
    content_w = phone_x - 40 - 15

    draw_card(c, 40, 105, content_w, 395, title="Localization & Production Mobile Engineering", bg_color=WHITE, border_color=BORDER_COLOR)

    y = 455
    y = draw_bullet(c, 54, y, "14 Major Indian Languages Supported:", "Comprehensive localization in English, हिन्दी (Hindi), বাংলা (Bengali), தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), ગુજરાતી (Gujarati), ಕನ್ನಡ (Kannada), മലയാളം (Malayalam), ਪੰਜਾਬੀ (Punjabi), ଓଡ଼ିଆ (Odia), অসমীয়া (Assamese), اردو (Urdu), and भोजपुरी (Bhojpuri).", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Zero-Restart Instant UI Translation:", "Language selection modal changes all text strings dynamically across active screens via i18next without restarting the app.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Hermes Native Bytecode Engine (5.9 MB):", "Compiled with React Native 0.86 & Expo SDK 57 on Hermes engine for instant cold starts (<800ms) and low memory consumption.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Crash-Proof Decoupled Architecture:", "Platform-specific resolution (.web.ts vs .native.ts) ensures zero browser DOM baggage in the native Android APK.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Top-Level Error Boundary Recovery:", "Component-level error boundaries present friendly recovery screens instead of OS crashes in rare network disconnects.", font_size=8.5, max_width=content_w - 28)
    y = draw_bullet(c, 54, y, "Statutory Audit Ledger & State Cloud:", "Encrypted local SQLite storage with cryptographic SHA-256 state hashing for statutory compliance audits.", font_size=8.5, max_width=content_w - 28)

    # Callout Box
    c.setFillColor(MINT_BG)
    c.setStrokeColor(BORDER_EMERALD)
    c.roundRect(54, 115, content_w - 28, 65, 6, fill=True, stroke=True)
    c.setFillColor(EMERALD_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(68, 162, "Pan-India Digital Sovereignty:")
    c.setFillColor(SLATE_BODY)
    c.setFont("Helvetica", 8)
    c.drawString(68, 147, "Built specifically for India's diverse linguistic fabric, Sahakari Seva ensures no shramik is excluded")
    c.drawString(68, 133, "due to language barriers, bridging the digital divide through cooperative technology.")

    # Attached Screenshot
    draw_screenshot_phone(c, phone_x, phone_y, phone_w, phone_h, SCREENSHOTS["language_modal"],
                          caption="Fig 17.1: 14 Indian Languages Selection")

    draw_slide_footer(c, 17)
    c.showPage()

# -----------------------------------------------------------------------------
# MAIN COMPILATION ENTRYPOINT
# -----------------------------------------------------------------------------
def generate_pdf(output_path):
    print(f"Generating 17-slide light-mode presentation PDF: {output_path}")
    c = canvas.Canvas(output_path, pagesize=landscape(A4))
    c.setTitle("Sahakari Seva — Comprehensive Architecture & Feature Presentation (Light Mode)")
    c.setAuthor("Sahakari Seva Cooperative Federation")
    c.setSubject("India's First Worker-Owned Urban Gig Cooperative Platform")
    c.setKeywords(["Sahakari Seva", "Cooperative", "Gig Economy", "85/10/5", "Ayushman Bharat", "QR Verification", "Worker Owned", "Light Mode"])

    print("Rendering Slide 1: Executive Cover...")
    build_slide_1(c)
    print("Rendering Slide 2: Economic Paradigm Shift...")
    build_slide_2(c)
    print("Rendering Slide 3: Order Lifecycle Phase 1...")
    build_slide_3(c)
    print("Rendering Slide 4: Order Lifecycle Phase 2...")
    build_slide_4(c)
    print("Rendering Slide 5: Worker Dashboard & Availability...")
    build_slide_5(c)
    print("Rendering Slide 6: Worker Schedule & Committed Jobs...")
    build_slide_6(c)
    print("Rendering Slide 7: Worker Job Detail & 85/10/5 Split...")
    build_slide_7(c)
    print("Rendering Slide 8: Live GIS Radar Map & Navigation...")
    build_slide_8(c)
    print("Rendering Slide 9: Dual-Phone Customer QR Protocol...")
    build_slide_9(c)
    print("Rendering Slide 10: Autonomous Sahakari AI Assistant...")
    build_slide_10(c)
    print("Rendering Slide 11: Shramik Welfare Passbook...")
    build_slide_11(c)
    print("Rendering Slide 12: Customer Citizen Discovery...")
    build_slide_12(c)
    print("Rendering Slide 13: Customer Search & Live Map...")
    build_slide_13(c)
    print("Rendering Slide 14: Customer Live Tracking & Bill...")
    build_slide_14(c)
    print("Rendering Slide 15: Admin Telemetry & AI Forecasting...")
    build_slide_15(c)
    print("Rendering Slide 16: Admin KYC & Workforce Allocation...")
    build_slide_16(c)
    print("Rendering Slide 17: 14 Languages & Architecture...")
    build_slide_17(c)

    c.save()
    print(f"Presentation PDF successfully created ({os.path.getsize(output_path)} bytes)!")

if __name__ == "__main__":
    out_dir = r"c:\Users\psuba\Downloads\Sahakari-Seva-main"
    out_file = os.path.join(out_dir, "Sahakari_Seva_Comprehensive_Presentation.pdf")
    generate_pdf(out_file)
