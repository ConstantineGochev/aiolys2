'use strict';

const db = require('./redis-clients').users;
const privateclient = require("./redis-clients").privateclient
/**
 * Convert the duration of a ban from minutes to seconds and return the value.
 * Default duration is 15 minutes.
 */
exports.banDuration = function(str) {
  return /^[1-9][0-9]*$/.test(str) ? str * 60 : 900;
};

/**
 * Helper function used to build leaderboards.
 * Rearrange database results in an object.
 */

exports.buildLeaderboards = function(pointsresults, timesresults) {
  const obj = {
    pointsleaderboard: [],
    timesleaderboard: []
  };
  for (let i = 0; i < pointsresults.length; i += 2) {
    obj.pointsleaderboard.push({
      username: pointsresults[i],
      totpoints: pointsresults[i + 1]
    });
    obj.timesleaderboard.push({
      username: timesresults[i],
      bestguesstime: (timesresults[i + 1] / 1000).toFixed(2)
    });
  }
  return obj;
};

/**
 * Return the string representation of a given date in the 'DD/MM/YYYY' format.
 */

exports.britishFormat = function(date) {
  let day = date.getDate();
  let month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (day < 10) {
    day = '0' + day;
  }
  if (month < 10) {
    month = '0' + month;
  }
  return day + '/' + month + '/' + year;
};

/**
 * Check whether a given string is a valid email address.
 */

exports.isEmail = function(str) {
  // Simple filter, but it covers most of the use cases.
  const filter = /^[+a-zA-Z0-9_.-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,6}$/;
  return filter.test(str);
};

/**
 * Check whether the given argument is a function.
 */

exports.isFunction = function(arg) {
  return typeof arg === 'function';
};

/**
 * Check whether the given argument is a string.
 */

exports.isString = function(arg) {
  return typeof arg === 'string';
};

/**
 * Check whether a given string is a well formed username.
 */

exports.isUsername = function(str) {
  const filter = /^[a-zA-Z0-9\-_]{1,15}$/;
  return filter.test(str);
};

/**
 * Get a random slogan.
 */

exports.randomSlogan = function() {
  const slogans = [
    '"You know you’re in love when you can’t fall asleep because reality is finally better than your dreams.”– Dr. Suess',
'"I’m selfish, impatient and a little insecure. I make mistakes, I am out of control and at times hard to handle. But if you can’t handle me at my worst, then you sure as hell don’t deserve me at my best.”– Marilyn Monroe',
'"Life is what happens when you’re busy making other plans.” – John Lennon',
'"Get busy living or get busy dying.”– Stephen King',
'"The first step toward success is taken when you refuse to be a captive of the environment in which you first find yourself.”– Mark Caine',
'"When one door of happiness closes, another opens; but often we look so long at the closed door that we do not see the one which has been opened for us.”– Helen Keller',
'"Twenty years from now you will be more disappointed by the things that you didn’t do than by the ones you did do.”– Mark Twain',
'"When I dare to be powerful – to use my strength in the service of my vision, then it becomes less and less important whether I am afraid.”– Audre Lorde',
'"A friend is one that knows you as you are, understands where you have been, accepts what you have become, and still, gently allows you to grow.” – William Shakespeare',
'"Great minds discuss ideas; average minds discuss events; small minds discuss people.”– Eleanor Roosevelt',
'"A successful man is one who can lay a firm foundation with the bricks others have thrown at him.”– David Brinkley',
'"Those who dare to fail miserably can achieve greatly.”– John F. Kennedy',
'"I can’t give you a sure-fire formula for success, but I can give you a formula for failure: try to please everybody all the time.”-Herbert Bayard Swope',
'"You only live once, but if you do it right, once is enough.” – Mae West',
'"Would you like me to give you a formula for success? It’s quite simple, really: Double your rate of failure. You are thinking of failure as the enemy of success. But it isn’t at all. You can be discouraged by failure or you can learn from it, so go ahead and make mistakes. Make all you can. Because remember that’s where you will find success.”– Thomas J. Watson',
'"He that falls in love with himself will have no rivals.” – Benjamin Franklin',
'"It is hard to fail, but it is worse never to have tried to succeed.”– Theodore Roosevelt',
'"I’m a success today because I had a friend who believed in me and I didn’t have the heart to let him down.”– Abraham Lincoln',
'"Love yourself first and everything else falls into line. You really have to love yourself to get anything done in this world.”– Lucille Ball',
'"Let us always meet each other with smile, for the smile is the beginning of love.”– Mother Theresa',
'"Challenges are what make life interesting and overcoming them is what makes life meaningful.”– Joshua J. Marine',
'"When one door closes, another opens; but we often look so long and so regretfully upon the closed door that we do not see the one that has opened for us.” – Alexander Graham Bell',
'"Love is a serious mental disease.”– Plato',
'"Our greatest fear should not be of failure… but of succeeding at things in life that don’t really matter.”– Francis Chan',
'"It had long since come to my attention that people of accomplishment rarely sat back and let things happen to them. They went out and happened to things.”– Leonardo Da Vinci',
'"Remember that the happiest people are not those getting more, but those giving more.”– H. Jackson Brown, Jr.',
'"It is our choices, that show what we truly are, far more than our abilities.”– J. K Rowling',
'"The only impossible journey is the one you never begin.” – Anthony Robbins',
'"Only put off until tomorrow what you are willing to die having left undone.” – Pablo Picasso',
'"If you want to be happy, be.” – Leo Tolstoy',
'"Many of life’s failures are people who did not realize how close they were to success when they gave up.” – Thomas A. Edison',
'"If you want to live a happy life, tie it to a goal, not to people or things.” – Albert Einstein',
'"Success is just a war of attrition. Sure, there’s an element of talent you should probably possess. But if you just stick around long enough, eventually something is going to happen.” – Dax Shepard',
'"The opposite of love is not hate; it’s indifference.” – Elie Wiesel',
'"Life is ten percent what happens to you and ninety percent how you respond to it.” – Charles Swindoll',
'"The good news is that the moment you decide that what you know is more important than what you have been taught to believe, you will have shifted gears in your quest for abundance. Success comes from within, not from without.” – Elie Wiesel',
'"I never knew how to worship until I knew how to love.” – Henry Ward Beecher',
'"Every great dream begins with a dreamer. Always remember, you have within you the strength, the patience, and the passion to reach for the stars to change the world.” – Harriet Tubman',
'"It is impossible to escape the impression that people commonly use false standards of measurement — that they seek power, success and wealth for themselves and admire them in others, and that they underestimate what is of true value in life.” – Sigmund Freud',
'"A friend is someone who gives you total freedom to be yourself.” – Jim Morrison',
'"All that we see and seem is but a dream within a dream.” – Edgar Allan Poe',
'"Every great dream begins with a dreamer. Always remember, you have within you the strength, the patience, and the passion to reach for the stars to change the world.” – Harriet Tubman',
'"Never let the fear of striking out keep you from playing the game.” – Babe Ruth',
'"Live in the sunshine, swim the sea, drink the wild air.” – Ralph Waldo Emerson',
'"Life is trying things to see if they work.”– Ray Bradbury',
'"Success in business requires training and discipline and hard work. But if you’re not frightened by these things, the opportunities are just as great today as they ever were.” – David Rockefeller',
'"The purpose of our lives is to be happy.” – Dalai Lama',
'"The No. 1 reason people fail in life is because they listen to their friends, family, and neighbors.” – Napoleon Hill',
'"Your time is limited, so don’t waste it living someone else’s life. Don’t be trapped by dogma – which is living with the results of other people’s thinking.” – Steve Jobs',
'"Success is how high you bounce when you hit bottom.” – George S. Patton',
'"You will face many defeats in life, but never let yourself be defeated.” – Maya Angelou',
'"May you live all the days of your life.” – Jonathan Swift',
'"In three words I can sum up everything I’ve learned about life: It goes on.” – Robert Frost',
'"Success is not final, failure is not fatal: it is the courage to continue that counts.” – Winston Churchill',
'"You’re not obligated to win. You’re obligated to keep trying. To the best you can do everyday.” – Jason Mraz',
'"If life were predictable it would cease to be life, and be without flavor.” – Eleanor Roosevelt',
'"If you don’t design your own life plan, chances are you’ll fall into someone else’s plan. And guess what they have planned for you? Not much.” – Jim Rohn',
'"The question isn’t who is going to let me; it’s who is going to stop me.” – Ayn Rand',
'"The three great essentials to achieve anything worthwhile are, first, hard work; second, stick-to-itiveness; third, common sense.” – Thomas A. Edison',
'"Life is like a box of chocolates. You never know what you’re going to get.” – Forrest Gump',
'"The successful warrior is the average man, with laser-like focus.” – Bruce Lee',
'"A man is a success if he gets up in the morning and gets to bed at night, and in between he does what he wants to do.” – Bob Dylan',
'"Yesterday is history, tomorrow is a mystery, today is a gift of God, which is why we call it the present.” – Bil Keane',
'"Life isn’t about finding yourself. Life is about creating yourself.” – George Bernard Shaw',
'"The whole secret of a successful life is to find out what is one’s destiny to do, and then do it.” – Henry Ford',
'"Success? I don’t know what that word means. I’m happy. But success, that goes back to what in somebody’s eyes success means. For me, success is inner peace. That’s a good day for me.” – Denzel Washington',
'"A kiss is a lovely trick designed by nature to stop speech when words become superfluous.” – Ingrid Bergman',
'"You miss 100 percent of the shots you never take.” – Wayne Gretzky',
'"In order to write about life first you must live it.” – Ernest Hemingway',
'"Life itself is the most wonderful fairy tale.” – Hans Christian Andersen',
'"Do not go where the path may lead; go instead where there is no path and leave a trail.” – Ralph Waldo Emerson',
'"We are what we repeatedly do; excellence, then, is not an act but a habit.” – Aristotle',
'"Always forgive your enemies; nothing annoys them so much.” – Oscar Wilde',
'"The big lesson in life, baby, is never be scared of anyone or anything.” – Frank Sinatra',
'"To love and be loved is to feel the sun from both sides.” – David Viscott',
'"If you aren’t going all the way, why go at all?” – Joe Namath',
'"Love is an irresistible desire to be irresistibly desired.” – Robert Frost',
'"Those who believe in telekinetics, raise my hand.” – Kurt Vonnegut',
'"I only regret that I have but one life to give for my country.” – Nathan Hale',
'"The person who reads too much and uses his brain too little will fall into lazy habits of thinking.” – Albert Einstein',
'"Better to have loved and lost, than to have never loved at all.” – St. Augustine',
'"Life would be tragic if it weren’t funny.” – Stephen Hawking',
'"Every child is an artist, the problem is staying an artist when you grow up.” – Pablo Picasso',
'"Have no fear of perfection, you’ll never reach it.” – Salvador Dali',
'"Life is not a problem to be solved, but a reality to be experienced.” – Søren Kierkegaard',
'"Curiosity about life in all of its aspects, I think, is still the secret of great creative people.” – Leo Burnett',
'"Imagination is the beginning of creation. You imagine what you desire, you will what you imagine, and at last, you create what you will.” – George Bernard Shaw',
'"Be yourself; everyone else is already taken.” – Oscar Wilde',
'"The journey of a thousand miles begins with one step.” – Lao Tzu',
'"Imagination was given to man to compensate him for what he is not, and a sense of humor was provided to console him for what he is.” – Oscar Wilde',
'"What you do speaks so loudly that I cannot hear what you say.” – Ralph Waldo Emerson',
'"Spread love everywhere you go: first of all in your own house. Give love to your children, to your wife or husband, to a next door neighbor. Let no one ever come to you without leaving better and happier. Be the living expression of God’s kindness; kindness in your face, kindness in your eyes, kindness in your smile, kindness in your warm greeting.” – Mother Theresa',
'"Be happy for this moment. This moment is your life.” – Omar Khayyam',
'"You must be the change you wish to see in the world.” – Gandhi',
'"Strive not to be a success, but rather to be of value.” – Albert Einstein',
'"Keep your face to the sunshine and you can never see the shadow.” – Helen Keller',
'"The best way out is always through.” – Robern Frost',
'"The dream crossed twilight between birth and dying.” – T. S. Eliot',
'"People are just as happy as they make up their minds to be.” – Abraham Lincoln',
'"Don’t think. Thinking is the enemy of creativity. It’s self-conscious, and anything self-conscious is lousy. You can’t try to do things. You simply must do things.” – Ray Bradbury',
'"Creativity is just connecting things. When you ask creative people how they did something, they feel a little guilty because they didn’t really do it, the just saw something. It seemed obvious to them after a while.” – Steve Jobs',
'"Sing like no one’s listening, love like you’ve never been hurt, dance like nobody’s watching, and live like it’s heaven on earth.” – Mark Twain',
'"The power of imagination makes us infinite.” – John Muir',
'"Doing the best at this moment puts you in the best place for the next moment.” – Oprah Winfrey',
'"Originality is nothing but judicious imitation.” – Voltaire',
'"Life is made of ever so many partings welded together.” – Charles Dickens',
  ];
  return slogans[Math.floor(Math.random() * slogans.length)];
};

/**
 * Return the sorting parameters used to get users ordered by best guess time.
 */

exports.sortParams = function(offset) {
  const params = [
    'users',
    'by',
    'user:*->bestguesstime',
    'get',
    '#',
    'get',
    'user:*->bestguesstime',
    'limit',
    offset,
    '30'
  ];
  return params;
};

/**
 * Handle `unban` command.
 */

exports.unban = function(ip, spark, callback) {
  const issuedby = spark.nickname;

  db.hget(['user:' + issuedby, 'role'], function(err, role) {
    if (err) {
      console.error(err.message);
      // Fail silently in case of error
      return callback(true);
    }

    if (role < 1) {
      return callback(false);
    }

    // At this point consider the command successfully executed
    callback(true);

    if (ip !== 'list') {
      return db.del('ban:' + ip);
    }

    // List all banned players
    db.keys(['ban:*'], function(err, replies) {
      if (err) {
        return console.error(err.message);
      }

      if (!replies.length) {
        spark.send('chatmsg', 'the ban list is empty.', 'binb', issuedby);
        return;
      }

      replies.forEach(function(key) {
        const bannedip = key.slice(4);
        db.get([key], function(err, reply) {
          if (err) {
            return console.error(err.message);
          }
          spark.send('chatmsg', bannedip + ' → ' + reply, 'binb', issuedby);
        });
      });
    });
  });
};
