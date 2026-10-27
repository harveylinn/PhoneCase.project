package com.phonecase.backend.member.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "members")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String account;
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    private String name;
    private String phone;
    @Column(name = "default_address")
    private String defaultAddress;

    private String role;
    private String status;
    
    // 由資料庫自動填入（DEFAULT / ON UPDATE current_timestamp()）
    @Column(name = "created_at", insertable = false, updatable = false)
    private String createdAt;
    
    @Column(name = "updated_at", insertable = false, updatable = false)
    private String updatedAt;

}
