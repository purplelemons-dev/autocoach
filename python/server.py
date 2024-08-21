from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from http.server import BaseHTTPRequestHandler, HTTPServer
from os import environ
from py_dotenv import read_dotenv
from json import dumps, loads
from time import sleep
import logging

chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_experimental_option("detach", True)

sleep(1)

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()), options=chrome_options
)

logging.basicConfig(force=True, level=logging.INFO)


def g():
    driver.get("https://coachhomeschool.org/blackboard/login/index.php")
    return


read_dotenv(".env")


class Handler(BaseHTTPRequestHandler):
    def send(self, content: str, status: int = 200):
        self.send_response(status)
        self.send_header("Content-type", "application/json")
        self.send_header("Content-length", len(content))
        self.end_headers()
        self.wfile.write(content.encode("utf-8"))

    def do_GET(self):
        try:
            g()

            sleep(1.5)

            username = driver.find_element(by=By.ID, value="username")
            password = driver.find_element(by=By.ID, value="password")
            login = driver.find_element(by=By.ID, value="loginbtn")

            user_key = environ["BB_USERNAME"]
            pass_key = environ["BB_PASSWORD"]
            logging.info((user_key, pass_key))

            username.send_keys(user_key)
            password.send_keys(pass_key)
            logging.info("sent keys")

            login.click()
            logging.info("clicked login")
            sleep(0.5)

            cookies: list[dict[str, str]] = driver.get_cookies()
            cookies = {"cookies": cookies}
            message = dumps(cookies)

            try:
                assert len(cookies["cookies"]) > 1
                self.send(message)
                logging.info("message sent")
            except Exception as e:
                logging.info(e)
                logging.info("Failed to send message")
                logging.info(message)
                with open("data/error.html", "w") as f:
                    f.write(driver.page_source)

            exit(0)

        except:
            message = '{"message":"Failed to load page"}'
            self.send(message, 500)

            logging.debug("Failed to load page")

        return


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 8080), Handler)
    logging.info("Starting server on http://localhost:8080")
    server.serve_forever()
