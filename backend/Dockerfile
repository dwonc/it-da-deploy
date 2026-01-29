FROM gradle:8.5-jdk21 AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
RUN gradle dependencies --no-daemon || true
COPY . .
RUN gradle clean build -x test --no-daemon

# Multi-stage build
FROM eclipse-temurin:21-jre
WORKDIR /app

# 로컬에서 빌드된 JAR 파일 복사
COPY build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]