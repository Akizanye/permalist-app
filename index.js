import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Track which user is active, and cache users/items in memory for quick lookup.
let currentUserId = 1;
let users = [];
let items = [];


async function loadUsers() {
  const {rows} = await db.query("SELECT * FROM users ORDER BY id");
  users = rows;
  if (!users.find(u => u.id === currentUserId) && users[0]){
    currentUserId = users[0].id;
  }
  return users;
};

app.get("/", async (req, res) => {
  try {
    // Load users and fetch the active user's items.
    await loadUsers();
    const {rows: items} = await db.query(
      "SELECT * FROM items WHERE user_id = $1 ORDER BY id ASC",
       [currentUserId]
      );
      
    const currentUser = users.find(u => u.id === currentUserId);
    res.render("index.ejs", {
      listTitle: currentUser ? `${currentUser.name}'s List`: "To-Do",
      listItems: items,
      users: users,
      currentUserId: currentUserId,
      accentColor: currentUser?.color || "#a683e3",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error loading list");
  }
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;
  
  try {
    // Insert new item for the active user.
    await db.query("INSERT INTO items (title, user_id) VALUES ($1, $2)",
                   [item, currentUserId]
                  );
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding item");
  }
});

app.post("/edit", async (req, res) => {
    const item = req.body.updatedItemTitle;
    const id = req.body.updatedItemId;

    try {
      // Update only if the item belongs to the active user.
      await db.query(
        "UPDATE items SET title = ($1) WHERE id = $2 AND user_id = $3 ", 
         [item, id, currentUserId]
        );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.status(500).send("Error editing item");
    }
});

app.post("/delete", async (req, res) => {
  const id = req.body.deleteItemId;
  try {
    // Delete only if the item belongs to the active user.
    await db.query(
      "DELETE FROM items WHERE id = $1 AND user_id = $2", 
      [id, currentUserId]
    );
    res.redirect("/");
  } catch (err) { 
    console.log(err);
    res.status(500).send("Error deleteing item");
  }
}); 


app.post("/user", async (req, res) => {
  await loadUsers();
  if(req.body.add === "new") {
    // Render new user form with current accent color.
    const currentUser = users.find(u => u.id === currentUserId);
    res.render("new.ejs", {
      accentColor: currentUser?.color || "#a683e3",
    });
  } else {
    currentUserId = Number(req.body.user);
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const {name, color } = req.body;
  try {
    // Create a new user and make them the active user.
    const result = await db.query(
      "INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id",
      [name, color || "#a683e3"]
    );
    currentUserId = result.rows[0].id;
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating user");
  }
});

app.post("/user/update", async (req, res) => {
  const { userId, newName } = req.body;
  try {
    // Rename a user by id.
    await db.query("UPDATE users SET name = $1 WHERE id = $2", [newName, userId]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating user name");
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 
