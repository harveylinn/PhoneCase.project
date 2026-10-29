package com.phonecase.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

// 簡易 CRM：會員（members）＋ 訂單（sales_order，以客戶代號 M + 會員 id 對應）
// 已取消的訂單不計入消費
@Service
public class CrmService {

    // 會員分群門檻
    private static final long VIP_SPENDING = 30_000;
    private static final int DORMANT_DAYS = 60;
    private static final int NEW_CUSTOMER_DAYS = 30;

    public record CrmCustomer(
            long id, String customerCode, String account, String name, String email, String phone,
            String status, LocalDate joinedAt, long orders, long spending, long averageOrder,
            LocalDate firstOrderDate, LocalDate lastOrderDate, Long daysSinceLastOrder, String segment) {
    }

    // members 會員數、buyers 有消費會員、newMembers 本月新會員、vip VIP 會員、dormant 非活躍會員
    // averageOrder 平均客單價、repeatRate 回購率（%）
    public record CrmSummary(long members, long buyers, long newMembers, long vip, long dormant,
            long averageOrder, long repeatRate) {
    }

    public record CrmReport(CrmSummary summary, List<CrmCustomer> customers) {
    }

    private final JdbcTemplate jdbcTemplate;

    public CrmService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // date 為瀏覽器日期，用來計算距今天數與本月新會員
    public CrmReport getReport(LocalDate date) {
        List<CrmCustomer> customers = jdbcTemplate.query("""
                SELECT m.id, m.account, m.name, m.email, m.phone, m.status, m.created_at,
                       COUNT(s.order_no) AS orders,
                       COALESCE(SUM(s.total_price), 0) AS spending,
                       MIN(DATE(s.order_date)) AS first_order,
                       MAX(DATE(s.order_date)) AS last_order
                FROM members m
                LEFT JOIN sales_order s
                       ON s.supplier_id = CONCAT('M', LPAD(m.id, 4, '0'))
                      AND s.status <> '已取消'
                WHERE m.role = 'CUSTOMER'
                GROUP BY m.id, m.account, m.name, m.email, m.phone, m.status, m.created_at
                ORDER BY spending DESC, m.id
                """, (rs, rowNum) -> {
            long orders = rs.getLong("orders");
            long spending = rs.getLong("spending");
            LocalDate firstOrder = toLocalDate(rs.getDate("first_order"));
            LocalDate lastOrder = toLocalDate(rs.getDate("last_order"));
            Long daysSince = lastOrder == null ? null : ChronoUnit.DAYS.between(lastOrder, date);
            Timestamp joined = rs.getTimestamp("created_at");

            return new CrmCustomer(
                    rs.getLong("id"),
                    ShopSyncService.customerCodeOf(rs.getLong("id")),
                    rs.getString("account"),
                    rs.getString("name"),
                    rs.getString("email"),
                    rs.getString("phone"),
                    rs.getString("status"),
                    joined == null ? null : joined.toLocalDateTime().toLocalDate(),
                    orders,
                    spending,
                    orders == 0 ? 0 : Math.round((double) spending / orders),
                    firstOrder,
                    lastOrder,
                    daysSince,
                    segmentOf(orders, spending, firstOrder, daysSince, date));
        });

        long buyers = customers.stream().filter(c -> c.orders() > 0).count();
        long repeaters = customers.stream().filter(c -> c.orders() >= 2).count();
        long totalOrders = customers.stream().mapToLong(CrmCustomer::orders).sum();
        long totalSpending = customers.stream().mapToLong(CrmCustomer::spending).sum();
        long newMembers = customers.stream()
                .filter(c -> c.joinedAt() != null
                        && c.joinedAt().getYear() == date.getYear()
                        && c.joinedAt().getMonth() == date.getMonth())
                .count();

        CrmSummary summary = new CrmSummary(
                customers.size(),
                buyers,
                newMembers,
                customers.stream().filter(c -> "VIP".equals(c.segment())).count(),
                customers.stream().filter(c -> "非活躍".equals(c.segment())).count(),
                totalOrders == 0 ? 0 : Math.round((double) totalSpending / totalOrders),
                buyers == 0 ? 0 : Math.round(repeaters * 100.0 / buyers));

        return new CrmReport(summary, customers);
    }

    // 分群優先順序：未下單 → 非活躍 → VIP → 新客 → 一般
    private String segmentOf(long orders, long spending, LocalDate firstOrder, Long daysSince, LocalDate date) {
        if (orders == 0) {
            return "未下單";
        }
        if (daysSince != null && daysSince > DORMANT_DAYS) {
            return "非活躍";
        }
        if (spending >= VIP_SPENDING) {
            return "VIP";
        }
        if (firstOrder != null && ChronoUnit.DAYS.between(firstOrder, date) <= NEW_CUSTOMER_DAYS) {
            return "新客";
        }
        return "一般";
    }

    private LocalDate toLocalDate(Date date) {
        return date == null ? null : date.toLocalDate();
    }
}
