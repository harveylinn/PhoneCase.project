package com.phonecase.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

// 訂單
@Entity
@Table(name = "sales_order")
public class SalesOrder extends BaseDocument {
}