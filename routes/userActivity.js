const express = require("express");
const Anime = require("../models/Anime");
const router = express.Router();
const User = require("../models/User");

module.exports = router;

//likedAnime
router.get("/likedAnime", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Extract page and limit from query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // Default limit
    const skip = (page - 1) * limit;

    const likedAnimes = await Anime.find({ mal_id: { $in: user.likedAnime } })
      .skip(skip)
      .limit(limit);
    res.json(likedAnimes);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//confirm if liked anime
router.get("/ifAnimeLiked/:mal_id", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const { mal_id } = req.params;
    const isLiked = user.likedAnime.includes(parseInt(mal_id));
    res.json({ isLiked });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.post("/likedAnimeAdd", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const { mal_id } = req.body;
    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    user.likedAnime.push(mal_id);
    await user.save();
    res.json({ message: "Added to favorite." });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.delete("/likedAnime/:mal_id", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const { mal_id } = req.params;
    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    user.likedAnime = user.likedAnime.filter((id) => id !== Number(mal_id));

    await user.save();
    res.json({ message: "Deleted from favorite." });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//likedPerson
router.get("/likedPerson", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // Default limit
    const skip = (page - 1) * limit;

    const likedPeople = await People.find({
      mal_id: { $in: user.likedPerson },
    })
      .skip(skip)
      .limit(limit);
    res.json(likedPeople);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.post("/likedPersonAdd", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const { mal_id } = req.body;
    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    user.likedPerson.push(mal_id);
    await user.save();
    res.json({ message: "likedPerson added" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.delete("/likedPerson/:mal_id", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const { mal_id } = req.params;
    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    user.likedPerson = user.likedPerson.filter((id) => id !== Number(mal_id));

    await user.save();
    res.json({ message: "likedPerson deleted" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//history
router.get("/history", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // Default limit
    const skip = (page - 1) * limit;

    // Paginate the user's history
    const paginatedHistory = user.history.slice(skip, skip + limit);
    const mal_ids = paginatedHistory.map((item) => item.mal_id);

    // Fetch the corresponding Anime documents in one query
    const animeDocuments = await Anime.find({ mal_id: { $in: mal_ids } });

    // Merge history with Anime details
    const historyWithDetails = paginatedHistory.map((historyItem) => {
      const animeDetail = animeDocuments.find(
        (anime) => anime.mal_id === historyItem.mal_id
      );
      return {
        ...historyItem.toObject(),
        animeDetail,
      };
    });

    res.json(historyWithDetails);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.post("/historyAdd", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const { mal_id } = req.body;
    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    const newHistoryEntry = {
      mal_id: mal_id,
      visitedOn: new Date(),
    };

    user.history.push(newHistoryEntry);
    await user.save();
    res.json({ message: "History added" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.delete("/history/:mal_id", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const { mal_id } = req.params;
    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    user.history = user.history.filter(
      (item) => item.mal_id !== Number(mal_id)
    );

    await user.save();
    res.json({ message: "History deleted" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//watchlist
router.get("/watchlist/:name", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const { name } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // Default limit
    const skip = (page - 1) * limit;

    let watchlists = [];

    const watchlist = user.watchlist.find((w) => w.name === name);
    if (!watchlist) {
      return res.status(404).send("Watchlist not found");
    }

    // Apply skip and limit to the items of the found watchlist
    const paginatedItems = watchlist.items.slice(skip, skip + limit);

    const detailedItems = await Anime.find({
      mal_id: { $in: paginatedItems },
    });

    watchlists = [
      {
        ...watchlist.toObject(),
        items: detailedItems,
      },
    ];

    res.json(watchlists);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//watchlists
router.get("/watchlists/", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    let paginatedWatchlists = [];
    if (parseInt(req.query.limit) === 0) {
      // If limit is 0, return all watchlists without pagination
      paginatedWatchlists = user.watchlist;
    } else {
      const page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 6; // Default limit is 6
      const skip = (page - 1) * limit;

      // Get watchlists with pagination
      paginatedWatchlists = user.watchlist.slice(skip, skip + limit);
    }

    const watchlists = await Promise.all(
      paginatedWatchlists.map(async (watchlist) => {
        let detailedItem = null;
        if (watchlist.items.length > 0) {
          // Only get the details of the first item
          detailedItem = await Anime.findOne({ mal_id: watchlist.items[0] });
        }
        return {
          ...watchlist.toObject(),
          items: detailedItem ? [detailedItem] : [], // Put the single object in an array
          // If you want the items field to always be an array, even if it has only one element
        };
      })
    );

    res.json(watchlists);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

//get all Watchlists which anime In
router.get("/animeInWatchlists/:mal_id", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const { mal_id } = req.params;
    const watchlistsContainingAnime = user.watchlist.filter((watchlist) =>
      watchlist.items.includes(parseInt(mal_id))
    );

    res.json(watchlistsContainingAnime);
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});
router.post("/watchlist/create", async (req, res) => {
  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send("User not found.");
    }

    let { name, mal_id, description } = req.body;

    name = name.trim();

    if (name.length < 1 || name.length > 150) {
      return res
        .status(400)
        .send("The name must be between 1 and 150 characters long.");
    }

    if (!/^[\w\s,.!?;:'"@#$%^&*()_+=-]*$/.test(name)) {
      return res.status(400).send("The name contains invalid characters.");
    }

    if (
      user.watchlist.some((w) => w.name.toLowerCase() === name.toLowerCase())
    ) {
      return res.status(400).send("A list with the same name already exists.");
    }

    // Limit the number of watchlist
    const MAX_WATCHLIST_COUNT = 5000;
    if (user.watchlist.length >= MAX_WATCHLIST_COUNT) {
      return res
        .status(400)
        .send(`You can only create up to ${MAX_WATCHLIST_COUNT} watchlists.`);
    }

    const newWatchlistEntry = {
      name: name,
      description: description ? description : "",
      items: mal_id ? [mal_id] : [],
    };

    user.watchlist.push(newWatchlistEntry);
    await user.save();

    res.json({ message: "List creaded successfully." });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.delete("/watchlist/:name", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const { name } = req.params;

    const watchlistExists = user.watchlist.some((w) => w.name === name);
    if (!watchlistExists) {
      return res.status(404).send("Watchlist not found");
    }

    user.watchlist = user.watchlist.filter((w) => w.name !== name);
    await user.save();

    res.json({ message: "Watchlist deleted successfully" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.post("/watchlist/:name/addItem", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    const { name } = req.params;
    const { mal_id } = req.body;
    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }
    if (!name) {
      return res.status(400).send("Name is required");
    }

    const watchlist = user.watchlist.find((w) => w.name === name);

    if (!watchlist) {
      return res.status(404).send("Watchlist not found");
    }

    // Limit the number of items in each watchlist
    const MAX_ITEMS_PER_WATCHLIST = 5000;
    if (watchlist.items.length >= MAX_ITEMS_PER_WATCHLIST) {
      return res
        .status(400)
        .send(
          `Each watchlist can only contain up to ${MAX_ITEMS_PER_WATCHLIST} items.`
        );
    }

    if (watchlist.items.includes(mal_id)) {
      return res.status(400).send("Anime already in watchlist");
    }

    watchlist.items.push(mal_id);

    await user.save();

    res.json({ message: `Added to ${name}` });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.delete("/watchlist/:name/item/:mal_id", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const { name, mal_id } = req.params;
    if (!name) {
      return res.status(400).send("Watchlist name is required");
    }
    if (!mal_id) {
      return res.status(400).send("mal_id is required");
    }

    const watchlist = user.watchlist.find((w) => w.name === name);
    if (!watchlist) {
      return res.status(404).send("Watchlist not found");
    }

    watchlist.items = watchlist.items.filter((item) => item !== Number(mal_id));

    await user.save();

    res.json({ message: `Removed from ${name}` });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.patch("/watchlist/rename/:oldName", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const { oldName } = req.params;
    const { newName } = req.body;
    if (!oldName || !newName) {
      return res.status(400).send("Both old name and new name are required");
    }

    const watchlist = user.watchlist.find((w) => w.name === oldName);
    if (!watchlist) {
      return res.status(404).send("Watchlist not found");
    }

    if (user.watchlist.some((w) => w.name === newName)) {
      return res
        .status(400)
        .send("Another watchlist with the new name already exists");
    }

    watchlist.name = newName;
    await user.save();

    res.json({ message: "Name changed successfully" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});

router.patch("/watchlist/updateDescription/:name", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    const { name } = req.params;
    const { description } = req.body;
    if (!name) {
      return res.status(400).send("Watchlist name is required");
    }
    if (description === undefined) {
      return res.status(400).send("New description is required");
    }

    const watchlist = user.watchlist.find((w) => w.name === name);
    if (!watchlist) {
      return res.status(404).send("Watchlist not found");
    }

    watchlist.description = description;
    await user.save();

    res.json({ message: "Description updated" });
  } catch (error) {
    console.error("Server error", error);
    res.status(500).send("Server error");
  }
});
