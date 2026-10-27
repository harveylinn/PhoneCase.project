package com.phonecase.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Profile("callback-only")
public class CallbackOnlyFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // 只允許綠界付款通知
        if (
            "/api/payment/ecpay/notify".equals(path)
            && "POST".equals(method)
        ) {

            filterChain.doFilter(request, response);
            return;
        }

        // 其他 API 全部拒絕
        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
    }
}