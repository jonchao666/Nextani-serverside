const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  local: {
    password: {
      type: String,
      set: (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(10)), // 密码加密
    },
  },
  // 社交账户信息
  google: {
    id: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: String,
    displayName: String,
    profilePicture: String,
  },
  microsoft: {
    id: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: String,
    displayName: String,
    profilePicture: String,
  },
  apple: {
    id: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: String,
    displayName: String,
    profilePicture: String,
  },
  // 共通的用户信息
  email: {
    type: String,
    unique: true,
    sparse: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ], // 简单的邮箱格式验证
  },
  updateEmailToken: String,
  deleteAccountToken: String,
  displayName: String,
  profilePicture: String,
  likedPerson: [Number],

  likedAnime: [Number],

  watchlist: {
    type: [
      {
        name: {
          type: String,
          required: true,
        },
        description: String,
        items: [Number],
      },
    ],
    default: [{ name: "Default", description: "", items: [] }], // default
  },

  history: [
    {
      mal_id: {
        type: Number,
        required: true,
      },
      visitedOn: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // 其他用户信息，例如性别、生日等
  // ...
});

// 在保存用户之前加密密码（如果密码被修改）
userSchema.pre("save", function (next) {
  if (!this.isModified("local.password")) return next();
  this.local.password = bcrypt.hashSync(
    this.local.password,
    bcrypt.genSaltSync(10)
  );
  next();
});

// 实用方法，例如验证密码
userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.local.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
