FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN pip install fastapi uvicorn pyjwt python-multipart bcrypt
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
