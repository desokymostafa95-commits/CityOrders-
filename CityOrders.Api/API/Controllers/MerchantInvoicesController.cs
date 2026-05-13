using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using CityOrders.Api.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using CityOrders.Api.Application.Services;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/merchant/invoices")]
    [ApiController]
    [Authorize]
    [Tags("Merchant - Shift")]
    public class MerchantInvoicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MerchantInvoicesController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (idClaim == null) throw new UnauthorizedAccessException();
            return int.Parse(idClaim.Value);
        }

        private async Task<int> GetBrandId(int userId)
        {
            var brand = await _context.Brands.FirstOrDefaultAsync(b => b.MerchantUserId == userId);
            if (brand == null) throw new InvalidOperationException("Merchant has no brand.");
            return brand.Id;
        }

        [HttpGet("shift/current")]
        public async Task<ActionResult<CurrentShiftDto>> GetCurrentShift()
        {
            var userId = GetUserId();
            var brand = await _context.Brands.FirstOrDefaultAsync(b => b.MerchantUserId == userId);
            if (brand == null)
            {
                return NotFound(new { error = "No brand found. Please complete your merchant setup first." });
            }
            var brandId = brand.Id;

            var currentShift = await _context.MerchantShifts
                .Where(s => s.BrandId == brandId && s.Status == ShiftStatus.Open)
                .OrderByDescending(s => s.StartAt)
                .FirstOrDefaultAsync();

            if (currentShift == null)
            {
                return Ok(new CurrentShiftDto { Status = "NoOpenShift" });
            }

            // Calculate live stats
            var stats = await _context.Orders
                .Where(o => o.BrandId == brandId && 
                            o.Status == OrderStatus.Delivered && 
                            o.DeliveredAt >= currentShift.StartAt)
                .Select(o => o.Total)
                .ToListAsync();

            return Ok(new CurrentShiftDto
            {
                ShiftId = currentShift.Id,
                StartAt = currentShift.StartAt,
                Status = "Open",
                LiveStats = new LiveStatsDto
                {
                    DeliveredOrdersCount = stats.Count,
                    EstimatedGrossSales = stats.Sum()
                }
            });
        }


        [HttpPost("shift/start")]
        [RequireActiveSubscription]
        public async Task<ActionResult<StartShiftResponseDto>> StartShift()
        {
            var userId = GetUserId();
            var brandId = await GetBrandId(userId);

            // Check if merchant is approved and active
            var merchantProfile = await _context.MerchantProfiles.FindAsync(userId);
            if (merchantProfile == null || !merchantProfile.IsApproved)
            {
                return StatusCode(403, "Your merchant account is pending admin approval. You cannot start a shift until approved.");
            }

            if (!merchantProfile.IsActive)
            {
                return StatusCode(403, "Your account is deactivated. Please contact us.");
            }

            var hasOpenShift = await _context.MerchantShifts
                .AnyAsync(s => s.BrandId == brandId && s.Status == ShiftStatus.Open);

            if (hasOpenShift)
            {
                return Conflict("A shift is already open. Close it first.");
            }

            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
            var randomPart = Guid.NewGuid().ToString("N").Substring(0, 3).ToUpper();

            var shift = new MerchantShift
            {
                BrandId = brandId,
                StartAt = DateTime.UtcNow,
                Status = ShiftStatus.Open,
                InvoiceNumber = $"INV-{brandId}-{timestamp}-{randomPart}"
            };

            merchantProfile.IsTemporarilyClosed = false;
            merchantProfile.TemporaryCloseReason = null;
            merchantProfile.TemporaryCloseUntil = null;
            
            // Sync new flag
            merchantProfile.IsOnShift = true;
            merchantProfile.ShiftUpdatedAt = DateTime.UtcNow;
            merchantProfile.ShiftAutoCloseAt = null;

            _context.MerchantShifts.Add(shift);
            await _context.SaveChangesAsync();

            return Ok(new StartShiftResponseDto
            {
                ShiftId = shift.Id,
                StartAt = shift.StartAt
            });
        }


        [HttpPost("shift/close")]
        [RequireActiveSubscription]
        public async Task<ActionResult<CloseShiftResponseDto>> CloseShift()
        {
            var userId = GetUserId();
            var brandId = await GetBrandId(userId);

            var currentShift = await _context.MerchantShifts
                .Where(s => s.BrandId == brandId && s.Status == ShiftStatus.Open)
                .OrderByDescending(s => s.StartAt)
                .FirstOrDefaultAsync();

            if (currentShift == null)
            {
                return NotFound("No open shift found to close.");
            }

            var brand = await _context.Brands.FindAsync(brandId);
            if (brand == null) return NotFound("Brand not found.");

            var closeTime = DateTime.UtcNow;

            // 1. Get all delivered orders since shift started
            var orders = await _context.Orders
                .Include(o => o.Items)
                .Where(o => o.BrandId == brandId && 
                            o.Status == OrderStatus.Delivered && 
                            o.DeliveredAt >= currentShift.StartAt)
                .ToListAsync();

            // 2. Generate line items (aggregated by product)
            var lines = orders.SelectMany(o => o.Items)
                .GroupBy(i => new { i.ProductId, i.ProductNameSnapshot, i.UnitPriceSnapshot })
                .Select(g => new MerchantShiftLine
                {
                    ProductId = g.Key.ProductId,
                    ProductNameSnapshot = g.Key.ProductNameSnapshot,
                    UnitPriceSnapshot = g.Key.UnitPriceSnapshot,
                    Quantity = g.Sum(i => i.Quantity),
                    LineTotal = g.Sum(i => i.LineTotal)
                }).ToList();

            // 3. Map orders to shift orders
            var shiftOrders = orders.Select(o => new MerchantShiftOrder
            {
                OrderId = o.Id,
                OrderNumberSnapshot = o.OrderNumber,
                TotalSnapshot = o.Total,
                DeliveredAtSnapshot = o.DeliveredAt ?? o.CreatedAt // Fallback just in case
            }).ToList();

            // 4. Update shift
            currentShift.Status = ShiftStatus.Closed;
            currentShift.EndAt = closeTime;
            currentShift.ClosedAt = closeTime;
            currentShift.DeliveredOrdersCount = orders.Count;
            currentShift.GrossSales = orders.Sum(o => o.Total);
            currentShift.Currency = "EGP"; // Could be dynamic
            currentShift.BrandNameSnapshot = brand.Name;
            currentShift.BrandAddressSnapshot = brand.Address;
            currentShift.BrandPhoneSnapshot = brand.Phone1;
            
            currentShift.Lines = lines;
            currentShift.Orders = shiftOrders;

            // Sync new flag
            // Sync new flag
            var profile = await _context.MerchantProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile != null)
            {
                profile.IsOnShift = false;
                profile.ShiftUpdatedAt = closeTime;
                profile.ShiftAutoCloseAt = null;
                
                // Reset temporary close status
                profile.IsTemporarilyClosed = false;
                profile.TemporaryCloseReason = null;
                profile.TemporaryCloseUntil = null;
                
                _context.MerchantProfiles.Update(profile);
            }

            await _context.SaveChangesAsync();

            return Ok(new CloseShiftResponseDto
            {
                InvoiceId = currentShift.Id,
                InvoiceNumber = currentShift.InvoiceNumber,
                StartAt = currentShift.StartAt,
                EndAt = currentShift.EndAt.Value,
                DeliveredOrdersCount = currentShift.DeliveredOrdersCount,
                GrossSales = currentShift.GrossSales,
                Currency = currentShift.Currency,
                ClosedAt = currentShift.ClosedAt.Value
            });
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetInvoices(
            [FromQuery] string? preset, 
            [FromQuery] DateTime? from, 
            [FromQuery] DateTime? to,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var userId = GetUserId();
            var brandId = await GetBrandId(userId);

            var query = _context.MerchantShifts
                .Where(s => s.BrandId == brandId && s.Status == ShiftStatus.Closed);

            // Apply filters
            if (!string.IsNullOrEmpty(preset))
            {
                var now = DateTime.UtcNow;
                switch (preset.ToLower())
                {
                    case "last24h": query = query.Where(s => s.ClosedAt >= now.AddHours(-24)); break;
                    case "last7d": query = query.Where(s => s.ClosedAt >= now.AddDays(-7)); break;
                    case "last30d": query = query.Where(s => s.ClosedAt >= now.AddDays(-30)); break;
                    case "last90d": query = query.Where(s => s.ClosedAt >= now.AddDays(-90)); break;
                }
            }
            else
            {
                if (from.HasValue) query = query.Where(s => s.ClosedAt >= from.Value);
                if (to.HasValue) query = query.Where(s => s.ClosedAt <= to.Value);
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(s => s.ClosedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new InvoiceSummaryDto
                {
                    InvoiceId = s.Id,
                    InvoiceNumber = s.InvoiceNumber,
                    StartAt = s.StartAt,
                    EndAt = s.EndAt ?? s.StartAt,
                    ClosedAt = s.ClosedAt ?? s.StartAt,
                    DeliveredOrdersCount = s.DeliveredOrdersCount,
                    GrossSales = s.GrossSales,
                    Currency = s.Currency
                })
                .ToListAsync();

            return Ok(new { page, pageSize, totalItems = total, totalPages = (int)Math.Ceiling(total / (double)pageSize), items });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InvoiceDetailDto>> GetInvoiceById(int id)
        {
            var userId = GetUserId();
            var brandId = await GetBrandId(userId);

            var invoice = await _context.MerchantShifts
                .Include(s => s.Lines)
                .Include(s => s.Orders)
                .FirstOrDefaultAsync(s => s.Id == id && s.BrandId == brandId);

            if (invoice == null) return NotFound();

            return Ok(new InvoiceDetailDto
            {
                InvoiceId = invoice.Id,
                InvoiceNumber = invoice.InvoiceNumber,
                StartAt = invoice.StartAt,
                EndAt = invoice.EndAt ?? invoice.StartAt,
                ClosedAt = invoice.ClosedAt ?? invoice.StartAt,
                DeliveredOrdersCount = invoice.DeliveredOrdersCount,
                GrossSales = invoice.GrossSales,
                Currency = invoice.Currency,
                Status = invoice.Status.ToString(),
                Brand = new InvoiceBrandSnapshotDto
                {
                    Name = invoice.BrandNameSnapshot,
                    Address = invoice.BrandAddressSnapshot,
                    Phone = invoice.BrandPhoneSnapshot
                },
                Lines = invoice.Lines.Select(l => new InvoiceLineDto
                {
                    ProductId = l.ProductId,
                    ProductName = l.ProductNameSnapshot,
                    UnitPrice = l.UnitPriceSnapshot,
                    Quantity = l.Quantity,
                    LineTotal = l.LineTotal
                }).ToList(),
                Orders = invoice.Orders.Select(o => new InvoiceOrderDto
                {
                    OrderId = o.OrderId,
                    OrderNumber = o.OrderNumberSnapshot,
                    OrderTotal = o.TotalSnapshot,
                    DeliveredAt = o.DeliveredAtSnapshot
                }).ToList()
            });
        }

        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> DownloadInvoicePdf(int id, [FromQuery] string lang = "en")
        {
            // Validate language parameter
            lang = (lang?.ToLower() == "ar") ? "ar" : "en";
            bool isRtl = lang == "ar";

            var userId = GetUserId();
            var brandId = await GetBrandId(userId);

            var invoice = await _context.MerchantShifts
                .Include(s => s.Lines)
                .Include(s => s.Orders)
                .FirstOrDefaultAsync(s => s.Id == id && s.BrandId == brandId);

            if (invoice == null) return NotFound();

            // Register fonts before generating PDF
            FontService.RegisterFonts();
            var fontFamily = FontService.GetFontFamily(lang);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontFamily(fontFamily).FontSize(10));

                    // Header with brand info and invoice title
                    page.Header().Row(row =>
                    {
                        if (isRtl)
                        {
                            // RTL layout: Invoice number on left, brand on right
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text(PdfTranslationService.T("invoice", lang)).FontSize(20).SemiBold().FontColor(Colors.Blue.Medium);
                                col.Item().Text($"#{invoice.InvoiceNumber}");
                                col.Item().Text($"{PdfTranslationService.T("closed_at", lang)}: {invoice.ClosedAt?.ToString("yyyy-MM-dd") ?? DateTime.UtcNow.ToString("yyyy-MM-dd")}");
                            });

                            row.RelativeItem().AlignRight().Column(col =>
                            {
                                col.Item().AlignRight().Text($"{invoice.BrandNameSnapshot}").FontSize(20).SemiBold().FontColor(Colors.Blue.Medium);
                                col.Item().AlignRight().Text($"{invoice.BrandAddressSnapshot}");
                                col.Item().AlignRight().Text($"{invoice.BrandPhoneSnapshot}");
                            });
                        }
                        else
                        {
                            // LTR layout: Brand on left, invoice number on right
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text($"{invoice.BrandNameSnapshot}").FontSize(20).SemiBold().FontColor(Colors.Blue.Medium);
                                col.Item().Text($"{invoice.BrandAddressSnapshot}");
                                col.Item().Text($"{invoice.BrandPhoneSnapshot}");
                            });

                            row.RelativeItem().AlignRight().Column(col =>
                            {
                                col.Item().Text(PdfTranslationService.T("invoice", lang)).FontSize(20).SemiBold();
                                col.Item().Text($"#{invoice.InvoiceNumber}");
                                col.Item().Text($"{PdfTranslationService.T("closed_at", lang)}: {invoice.ClosedAt?.ToString("yyyy-MM-dd") ?? DateTime.UtcNow.ToString("yyyy-MM-dd")}");
                            });
                        }
                    });

                    // Content with invoice lines table
                    page.Content().PaddingVertical(10).Column(x =>
                    {
                        x.Spacing(10);

                        // Invoice period info
                        x.Item().Row(row =>
                        {
                            row.RelativeItem().Text($"{PdfTranslationService.T("period", lang)}: {invoice.StartAt.ToString("yyyy-MM-dd")}");
                            row.RelativeItem().Text($"{PdfTranslationService.T("to", lang)}: {invoice.EndAt?.ToString("yyyy-MM-dd") ?? "N/A"}");
                        });

                        // Items table
                        x.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3); // Product name
                                columns.RelativeColumn();  // Price
                                columns.RelativeColumn();  // Qty
                                columns.RelativeColumn();  // Total
                            });

                            table.Header(header =>
                            {
                                if (isRtl)
                                {
                                    // RTL: reverse column order
                                    header.Cell().Element(CellStyle).AlignRight().Text(PdfTranslationService.T("total", lang));
                                    header.Cell().Element(CellStyle).AlignRight().Text(PdfTranslationService.T("qty", lang));
                                    header.Cell().Element(CellStyle).AlignRight().Text(PdfTranslationService.T("price", lang));
                                    header.Cell().Element(CellStyle).AlignRight().Text(PdfTranslationService.T("product", lang));
                                }
                                else
                                {
                                    // LTR: normal order
                                    header.Cell().Element(CellStyle).Text(PdfTranslationService.T("product", lang));
                                    header.Cell().Element(CellStyle).AlignRight().Text(PdfTranslationService.T("price", lang));
                                    header.Cell().Element(CellStyle).AlignRight().Text(PdfTranslationService.T("qty", lang));
                                    header.Cell().Element(CellStyle).AlignRight().Text(PdfTranslationService.T("total", lang));
                                }

                                static IContainer CellStyle(IContainer container)
                                {
                                    return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                                }
                            });

                            foreach (var item in invoice.Lines)
                            {
                                if (isRtl)
                                {
                                    // RTL: reverse column order
                                    table.Cell().Element(ContentStyle).AlignRight().Text($"{item.LineTotal:N2}");
                                    table.Cell().Element(ContentStyle).AlignRight().Text($"{item.Quantity}");
                                    table.Cell().Element(ContentStyle).AlignRight().Text($"{item.UnitPriceSnapshot:N2}");
                                    table.Cell().Element(ContentStyle).AlignRight().Text(item.ProductNameSnapshot);
                                }
                                else
                                {
                                    // LTR: normal order
                                    table.Cell().Element(ContentStyle).Text(item.ProductNameSnapshot);
                                    table.Cell().Element(ContentStyle).AlignRight().Text($"{item.UnitPriceSnapshot:N2}");
                                    table.Cell().Element(ContentStyle).AlignRight().Text($"{item.Quantity}");
                                    table.Cell().Element(ContentStyle).AlignRight().Text($"{item.LineTotal:N2}");
                                }

                                static IContainer ContentStyle(IContainer container)
                                {
                                    return container.PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten2);
                                }
                            }
                        });

                        // Grand total
                        x.Item().AlignRight().PaddingTop(5).Text(t =>
                        {
                            t.Span($"{PdfTranslationService.T("gross_sales", lang)}: ").FontSize(14).SemiBold();
                            t.Span($"{invoice.GrossSales:N2} {invoice.Currency}").FontSize(14).SemiBold().FontColor(Colors.Green.Medium);
                        });

                        // Orders summary
                        if (invoice.Orders != null && invoice.Orders.Any())
                        {
                            x.Item().PaddingTop(15).Text($"{PdfTranslationService.T("orders", lang)} ({invoice.Orders.Count})").FontSize(12).SemiBold();
                            x.Item().PaddingTop(5).Column(col =>
                            {
                                foreach (var order in invoice.Orders.Take(10)) // Limit to first 10 orders
                                {
                                    col.Item().Row(row =>
                                    {
                                        row.RelativeItem().Text(order.OrderNumberSnapshot);
                                        row.RelativeItem().AlignRight().Text($"{order.TotalSnapshot:N2}");
                                    });
                                }
                                if (invoice.Orders.Count > 10)
                                {
                                    col.Item().PaddingTop(5).Text($"... {PdfTranslationService.T("and", lang)} {invoice.Orders.Count - 10} {PdfTranslationService.T("more", lang)}").FontSize(9).Italic();
                                }
                            });
                        }
                    });

                    // Footer with page number
                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span($"{PdfTranslationService.T("page", lang)} ");
                        x.CurrentPageNumber();
                        x.Span($" {PdfTranslationService.T("of", lang)} ");
                        x.TotalPages();
                    });
                });
            });

            byte[] pdfBytes = document.GeneratePdf();
            return File(pdfBytes, "application/pdf", $"{invoice.InvoiceNumber}_{lang}.pdf");
        }
    }
}
