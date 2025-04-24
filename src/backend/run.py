from app import create_app

app = create_app()

@app.route('/')
def home_page():
    return 'Welcome to the children health tracking app.'

if __name__ == "__main__":
    app.run(debug=True)