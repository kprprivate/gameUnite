from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/register", methods=["GET"])
def register():
    username = request.args.get('username')

    print(username)

    return "Hello World!"

if __name__ == "__main__":
    app.run()