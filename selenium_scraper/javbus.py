from selenium import webdriver
from selenium.webdriver.chrome.options import Options

root_url = "https://www.javbus.com"
user_data_path = "E:\\workspace\\movie_center_ui\\cache\\chromium_cache\\user-data"
disk_cache_path = "E:\\workspace\\movie_center_ui\\cache\\chromium_cache\\disk-cache"
chrome_exe_path = "E:\\workspace\\movie_center_ui\\chrome-win-87\\chrome.exe"
chrome_driver_path = "E:\\workspace\\movie_center_ui\\selenium_scraper\\chromedriver.exe"
proxy_server_address = "http://localhost:1080"

chrome_options=Options()
# chrome_options.add_argument("--headless") #设置chrome浏览器无界面模式
chrome_options.binary_location = chrome_exe_path
chrome_options.add_argument("user-data-dir=" + user_data_path)
chrome_options.add_argument("disk-cache-dir=" + disk_cache_path)
chrome_options.add_argument("window-size=1000,1000")
chrome_options.add_argument("proxy-server=" + proxy_server_address)

#建立浏览器实例
browser = webdriver.Chrome(options=chrome_options, executable_path=chrome_driver_path)
# 开始请求
browser.get(root_url)

browser.find_elements_by_xpath()



