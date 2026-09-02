#!/usr/bin/env python3
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import Color, HexColor, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    ListFlowable, ListItem, KeepTogether, HRFlowable, PageBreak,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

OUT = "/home/user/LeadFlow_Estimate_Walkthrough_for_Reps.pdf"

ORANGE = HexColor("#EA580C")
SLATE = HexColor("#0F172A")
MUTED = HexColor("#475569")
LIGHT = HexColor("#F1F5F9")
LINE = HexColor("#E2E8F0")
GREEN = HexColor("#047857")
CARD = HexColor("#FFF7ED")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverKicker", fontName="Helvetica", fontSize=10, textColor=ORANGE,
    tracking=1, spaceAfter=6, alignment=TA_LEFT,
))
styles.add(ParagraphStyle(
    name="CoverTitle", fontName="Helvetica-Bold", fontSize=26, textColor=SLATE,
    leading=32, spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="CoverSub", fontName="Helvetica", fontSize=12, textColor=MUTED,
    leading=16, spaceAfter=12,
))
styles.add(ParagraphStyle(
    name="H1", fontName="Helvetica-Bold", fontSize=14, textColor=SLATE,
    spaceBefore=14, spaceAfter=8, leading=18,
))
styles.add(ParagraphStyle(
    name="H2", fontName="Helvetica-Bold", fontSize=11, textColor=ORANGE,
    spaceBefore=10, spaceAfter=4, leading=14,
))
styles.add(ParagraphStyle(
    name="Body", fontName="Helvetica", fontSize=10.5, textColor=SLATE,
    leading=15, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="Tip", fontName="Helvetica", fontSize=9.5, textColor=MUTED,
    leading=13, leftIndent=8, spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="StepNum", fontName="Helvetica-Bold", fontSize=10, textColor=white,
    alignment=TA_CENTER, leading=12,
))
styles.add(ParagraphStyle(
    name="StepTitle", fontName="Helvetica-Bold", fontSize=11, textColor=SLATE,
    leading=14, spaceAfter=2,
))
styles.add(ParagraphStyle(
    name="StepBody", fontName="Helvetica", fontSize=10, textColor=MUTED,
    leading=14,
))
styles.add(ParagraphStyle(
    name="Footer", fontName="Helvetica", fontSize=8, textColor=MUTED,
    alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="BulletBody", fontName="Helvetica", fontSize=10.5, textColor=SLATE,
    leading=14, leftIndent=4,
))


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(ORANGE)
    canvas.rect(0, letter[1] - 8, letter[0], 8, fill=1, stroke=0)
    canvas.setFillColor(SLATE)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(0.7 * inch, 0.45 * inch, "LeadFlow  ·  Albany BuildPros")
    canvas.drawRightString(letter[0] - 0.7 * inch, 0.45 * inch, f"Page {doc.page}")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(0.7 * inch, 0.6 * inch, letter[0] - 0.7 * inch, 0.6 * inch)
    canvas.restoreState()


def step_block(num, title, body):
    badge = Table(
        [[Paragraph(str(num), styles["StepNum"])]],
        colWidths=[22], rowHeights=[22],
    )
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ORANGE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    text = [
        Paragraph(title, styles["StepTitle"]),
        Paragraph(body, styles["StepBody"]),
    ]
    inner = Table(
        [[badge, text]],
        colWidths=[30, 6.4 * inch],
    )
    inner.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.4, LINE),
    ]))
    return KeepTogether([inner, Spacer(1, 8)])


doc = SimpleDocTemplate(
    OUT,
    pagesize=letter,
    leftMargin=0.7 * inch,
    rightMargin=0.7 * inch,
    topMargin=0.7 * inch,
    bottomMargin=0.8 * inch,
    title="Creating an Estimate in LeadFlow — Rep Walkthrough",
    author="JMB Business Solutions / Albany BuildPros",
)

story = []

story.append(Paragraph("ALBANY BUILDPROS  ·  LEADFLOW CRM", styles["CoverKicker"]))
story.append(Paragraph("Creating an Estimate<br/>with Photos", styles["CoverTitle"]))
story.append(Paragraph(
    "A field guide for sales reps. Walk a customer from roof to signed quote "
    "without making them climb a ladder.",
    styles["CoverSub"],
))
story.append(HRFlowable(width="100%", thickness=2, color=ORANGE, spaceAfter=14))

story.append(Paragraph("What this is for", styles["H1"]))
story.append(Paragraph(
    "Use LeadFlow on your phone or laptop while you’re at the house. You’ll "
    "build a quote from the pricebook (the same services you used in Housecall Pro), "
    "snap pictures of the damage, and send the customer a link they can review "
    "and sign. They see the photos on the estimate — they don’t need to get on the roof.",
    styles["Body"],
))

story.append(Paragraph("Before you start", styles["H1"]))
story.append(Paragraph(
    "• You need a <b>lead</b> for this customer (name + address at minimum). If they aren’t in LeadFlow yet, add them from Prospects → New.<br/>"
    "• Sign in at the usual LeadFlow site on your phone’s browser. Add it to your Home Screen if you haven’t — it behaves like an app.<br/>"
    "• iPhone camera tip: Settings → Camera → Formats → <b>Most Compatible</b> so photos upload as JPEG (HEIC sometimes skips the PDF).",
    styles["Body"],
))

story.append(Paragraph("The walkthrough", styles["H1"]))

story.append(step_block(
    1, "Open the customer",
    "Go to <b>Prospects</b>, find the job, tap the name. Confirm the address is right — it prints on the estimate.",
))
story.append(step_block(
    2, "Start a new estimate",
    "On the lead, tap <b>Create Estimate</b> (or Estimates → New and pick this customer). Give it a short title if you want, e.g. “North slope repair.” Tax rate can wait — office can set it later. Save. You’re now on the estimate screen.",
))
story.append(step_block(
    3, "Add the work from the pricebook",
    "Under Line Items, open <b>From pricebook</b>. Services are grouped (Roofing, Siding, Gutters…). Pick the job — “Owens Corning Duration Shingle Roof,” plywood replacement, etc. The <b>full work description and price fill in automatically</b>. Change quantity or price if this house is different. You can still type a custom line for one-offs. Tap <b>Add</b>. Repeat for every item on this quote.",
))
story.append(step_block(
    4, "Take and upload photos",
    "Scroll to the <b>Photos</b> card (under the line items). Optional caption first — “Hail damage, north slope” helps the customer. Then tap the file button. On a phone this opens the <b>camera</b> (rear camera). Shoot the damage, leak stains, missing shingles, close-ups. You can pick multiple photos at once. Tap <b>Upload photos</b>. Wait until it finishes before leaving the page. Remove any shot that didn’t come out.",
))
story.append(step_block(
    5, "Check what the customer will see",
    "Descriptions should read like a scope of work (not a one-word label). Photos should make the problem obvious from the ground. Totals are on the right. Add notes if you promised something extra (“price includes 2 sheets of decking”).",
))
story.append(step_block(
    6, "Send it",
    "On the right, <b>Send to Customer</b>. If they have an email on the lead, LeadFlow emails a link. Always copy the link too — text it, AirDrop it, whatever they actually check. They open it, see the work + photos + price, and can accept (pay direct or finance) and sign on their phone.",
))
story.append(step_block(
    7, "If they sign on paper instead",
    "Don’t wait for the link. Use <b>Office Actions</b> on the estimate to mark it accepted (or declined). That’s for the clipboard-in-the-driveway close.",
))

story.append(Paragraph("What the customer sees", styles["H1"]))
story.append(Paragraph(
    "Their page shows: company branding, their address, every line with the full description of work, "
    "your photos with captions, the total, then Accept / Decline. After they accept they can sign. "
    "They get a PDF copy of the signed estimate — photos included (JPEG/PNG).",
    styles["Body"],
))

story.append(Paragraph("Quick “don’ts”", styles["H1"]))
story.append(Paragraph(
    "• Don’t send an estimate with no line items — it will refuse.<br/>"
    "• Don’t upload blurry or upside-down shots. One clear close-up beats six dark ones.<br/>"
    "• Don’t put materials orders on the estimate. Materials (what we buy) is a different screen. Pricebook is what we sell.<br/>"
    "• Don’t edit an estimate after it’s accepted or declined — it’s locked. Start a new one if the scope changes.",
    styles["Body"],
))

story.append(Paragraph("If something breaks", styles["H1"]))
story.append(Paragraph(
    "Upload stuck? Stay on the page, check signal, try one photo at a time, JPEG not HEIC.<br/>"
    "Pricebook empty? Hard-refresh. If still empty, tell the office — don’t type a 1,600-word roof description by hand.<br/>"
    "Customer didn’t get the email? Text the link. Young domains land in spam; the link always works.",
    styles["Body"],
))

tip = Table(
    [[Paragraph(
        "<b>Field rhythm that works:</b> walk the roof → shoot photos while you’re up there → "
        "build the estimate in the driveway → show them the link on your phone before you leave. "
        "They see the damage without climbing. That’s the whole point.",
        styles["Body"],
    )]],
    colWidths=[7.1 * inch],
)
tip.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), CARD),
    ("BOX", (0, 0), (-1, -1), 1, ORANGE),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
]))
story.append(Spacer(1, 8))
story.append(tip)
story.append(Spacer(1, 16))
story.append(Paragraph(
    "Questions? Ask the office. This sheet is LeadFlow as of September 2026 — pricebook + estimate photos.",
    styles["Tip"],
))

doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
print("wrote", OUT)
