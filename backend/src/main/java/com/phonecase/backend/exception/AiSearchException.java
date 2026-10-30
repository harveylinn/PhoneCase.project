package com.phonecase.backend.exception;

/** AI 搜尋專用例外，避免把 Ollama 或模型的原始錯誤直接顯示給使用者。 */
public class AiSearchException extends RuntimeException {

    private final String code;

    public AiSearchException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
