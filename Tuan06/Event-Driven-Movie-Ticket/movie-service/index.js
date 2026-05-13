const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let nextId = 4;
let movies = [
    { id: 1, title: 'Avenger: Endgame', price: 100000, poster: '🦸‍♂️', genre: 'Action', duration: 181 },
    { id: 2, title: 'Lật Mặt 7', price: 85000, poster: '🎬', genre: 'Drama', duration: 120 },
    { id: 3, title: 'Doraemon', price: 75000, poster: '🐱', genre: 'Animation', duration: 95 },
];

// GET all movies
app.get('/movies', (req, res) => {
    res.json(movies);
});

// POST add new movie
app.post('/movies', (req, res) => {
    const { title, price, poster, genre, duration } = req.body;
    if (!title || !price) return res.status(400).json({ error: 'title and price are required' });
    const movie = { id: nextId++, title, price: parseFloat(price), poster: poster || '🎥', genre: genre || '', duration: duration || 0 };
    movies.push(movie);
    console.log(`[Movie Service] Added new movie: ${title}`);
    res.status(201).json(movie);
});

// PUT update movie
app.put('/movies/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const idx = movies.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Movie not found' });
    movies[idx] = { ...movies[idx], ...req.body, id };
    console.log(`[Movie Service] Updated movie #${id}`);
    res.json(movies[idx]);
});

const PORT = 8082;
app.listen(PORT, () => {
    console.log(`[Movie Service] running on port ${PORT}`);
});
