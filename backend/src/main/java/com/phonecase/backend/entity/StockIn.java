package com.phonecase.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

// 入庫單：唯一可以增加庫存的單據
@Entity
@Table(name = "stock_in")
public class StockIn extends BaseDocument {
}