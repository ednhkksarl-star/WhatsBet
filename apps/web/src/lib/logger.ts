type LogLevel = "info" | "warn" | "error";

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload = { level, message, ts: new Date().toISOString(), ...context };
  if (level === "error") {
    console.error(JSON.stringify(payload));
  } else if (level === "warn") {
    console.warn(JSON.stringify(payload));
  } else {
    console.log(JSON.stringify(payload));
  }

  if (level === "error" && process.env.SENTRY_DSN) {
    void fetch(process.env.SENTRY_DSN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        level: "error",
        extra: context,
      }),
    }).catch(() => undefined);
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
};
