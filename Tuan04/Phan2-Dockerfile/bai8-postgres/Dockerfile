FROM postgres:15-alpine

ENV POSTGRES_USER=tien
ENV POSTGRES_PASSWORD=12345678
ENV POSTGRES_DB=mydb

COPY init.sql /docker-entrypoint-initdb.d/init.sql

EXPOSE 5432
