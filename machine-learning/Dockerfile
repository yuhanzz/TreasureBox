FROM python:3.8.0

COPY . /app/

WORKDIR /app

RUN pip install -r requirements.txt

EXPOSE 9090

ENTRYPOINT ["python", "main.py"]