package com.phonecase.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

// 採購單
@Entity
@Table(name = "purchase_order")
public class PurchaseOrder extends BaseDocument {
}