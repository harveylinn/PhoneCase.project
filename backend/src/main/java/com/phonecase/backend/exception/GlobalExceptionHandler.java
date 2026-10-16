package com.example.phonecase.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleValidationErrors(
            MethodArgumentNotValidException exception){
        Map<String ,String> errors = new HashMap<>();

        for (var error : exception
                .getBindingResult()
                .getFieldErrors()){

            errors.put(
                    error.getField(),
                    error.getDefaultMessage()
            );

        }


        return errors;
    }

    @ExceptionHandler(ResponseStatusException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleResponseStatusError(
            ResponseStatusException exception) {
        Map<String, String> error = new HashMap<>();
        error.put("message", exception.getReason() == null
                ? "操作失敗"
                : exception.getReason());
        return error;
    }
}
