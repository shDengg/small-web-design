# Startup Project (for any OS)

Download and extract the file `final-product.zip` 



> Environment required for the project
> 1. Python (back-end)
> 2. node.js and npm (front-end)  
>
> Optional IDE's to run the code
> * [Visual Studio Code](https://code.visualstudio.com/download)
> * [Pycharm (for Python)](https://www.jetbrains.com/pycharm/download/?section=windows)
> * [Webstorm (for Vue.js)](https://www.jetbrains.com/webstorm/)  



## Run Back-end (python)
1. Open the project file using the terminal and then `cd backend`
2. run `pip install -r requirement.txt` to download required packages
3. Then `cd app` to head to the app directory
4. Entering commands in the terminal is used to create the database `python flask create` 
5. run `run.app`
6. If the run is successful the following message is displayed
```
* Serving Flask app 'app'
* Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
* Running on http://127.0.0.1:5000
Press CTRL+C to quit
* Restarting with stat
* Debugger is active!
* Debugger PIN: 936-397-333
```
7. keep terminal running on the background

## Run Front-end (node.js)
1. Open the project file using the terminal and then `cd frontend`
2. run `npm install`
5. At the command line, enter `npm run dev` to run the front-end web page.
6. Click on the URL that appears to open the web page
```
  VITE v6.2.0  ready in 398 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Product File Structure
### Back-end File Structure
```
backend/
├── app
│   ├── __init__.py
│   ├── app.py
│   ├── cli.py
│   ├── config.py
│   ├── extensions.py
│   ├── models.py
│   └── routes/
│       ├── child.py
│       ├── feed.py
│       ├── growth.py
│       ├── medication.py
│       ├── nappy_change.py
│       ├── report_routes.py
│       ├── sleep.py
│       └── temperature.py
├── instance
│   └── children.sqlite # Database
├── requirement.txt
└── run.py
```

### Front-end Structure
```
frontend/
├── index.html
├── package-lock.json
├── package.json
├── public/
│   ├── favicon.ico
│   └── vite.svg
├── src/
│   ├── App.vue
│   ├── components/
│   │   ├── AppHeader.vue
│   │   ├── ChildForms.vue
│   │   ├── ChildrenList.vue
│   │   ├── Dashboard.vue
│   │   └── RecordDialogs.vue
│   ├── main.js
│   ├── store/
│   │   └── index.js
│   ├── style.css
│   └── utils/
│       ├── chartHelpers.js
│       ├── formHelpers.js
│       └── formModels.js
└── vite.config.js
```