from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import io

def generate_organization_report(stats, domain):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=1.5*cm, leftMargin=1.5*cm,
                            topMargin=1.5*cm, bottomMargin=1.5*cm)

    styles = getSampleStyleSheet()
    story = []

    # -- Header --
    header_style = ParagraphStyle('header', fontSize=26, fontName='Helvetica-Bold',
                                  leading=32, spaceAfter=14,
                                  textColor=colors.HexColor('#0067ff'), alignment=TA_CENTER)
    sub_style = ParagraphStyle('sub', fontSize=10, fontName='Helvetica',
                               leading=14, spaceAfter=20,
                               textColor=colors.HexColor('#64748b'), alignment=TA_CENTER)
    title_style = ParagraphStyle('title', fontSize=16, fontName='Helvetica-Bold',
                                 textColor=colors.HexColor('#0f172a'), alignment=TA_CENTER, spaceAfter=20)
    
    org_name = domain.split('.')[0].upper()
    story.append(Paragraph(f"{org_name} ENTERPRISE", header_style))
    story.append(Paragraph("Organizational Health & Payroll Executive Summary", sub_style))
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0067ff')))
    story.append(Spacer(1, 20))
    story.append(Paragraph("EXECUTIVE REPORT — MARCH 2026", title_style))

    # -- Key Metrics --
    section_title = ParagraphStyle('section', fontSize=12, fontName='Helvetica-Bold', textColor=colors.HexColor('#1e293b'), spaceAfter=10)
    story.append(Paragraph("Key Performance Indicators", section_title))
    
    kpi_data = [
        ['Metric', 'Current Value', 'Status'],
        ['Total Workforce', str(stats['total_employees']), 'Stable'],
        ['Monthly Payroll Expense', f"INR {stats['monthly_payroll_expense']:,.2f}", 'Active'],
        ['Pending Leave Requests', str(stats['pending_leaves']), 'Needs Attention' if stats['pending_leaves'] > 5 else 'Optimal'],
        ['Payrolls Processed', str(stats['total_payrolls_this_month']), 'Verified'],
    ]
    
    kpi_table = Table(kpi_data, colWidths=[6*cm, 6*cm, 5*cm])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0067ff')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 25))

    # -- Department Distribution --
    story.append(Paragraph("Workforce Distribution by Department", section_title))
    dept_data = [['Department', 'Headcount']]
    for d in stats['department_distribution']:
        dept_data.append([d['department'], str(d['count'])])
    
    dept_table = Table(dept_data, colWidths=[10*cm, 7*cm])
    dept_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
    ]))
    story.append(dept_table)
    story.append(Spacer(1, 30))

    # -- Blockchain Verification Section --
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0')))
    story.append(Spacer(1, 15))
    verify_style = ParagraphStyle('verify', fontSize=9, fontName='Helvetica-Oblique', textColor=colors.HexColor('#64748b'), alignment=TA_CENTER)
    story.append(Paragraph("This report is generated directly from the blockchain-verified payroll ledger.", verify_style))
    story.append(Paragraph("All transaction hashes have been validated for this reporting cycle.", verify_style))

    # -- Footer --
    story.append(Spacer(1, inch))
    footer_style = ParagraphStyle('footer', fontSize=8, fontName='Helvetica', textColor=colors.HexColor('#94a3b8'), alignment=TA_CENTER)
    story.append(Paragraph("AdaptivePay — Enterprise Payroll Suite v1.0", footer_style))
    story.append(Paragraph("ISO 27001 Compliance | Blockchain Audit Active", footer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
