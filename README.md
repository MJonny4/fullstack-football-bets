# 🏆 GoalGuessers - Virtual Football Betting Platform

**A professional virtual football betting platform built with Laravel, Livewire, and TailwindCSS. Features a complete fantasy league with 20 teams, realistic match simulations, and a comprehensive betting system using virtual currency.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Laravel](https://img.shields.io/badge/Laravel-12.30.1-red.svg)
![Livewire](https://img.shields.io/badge/Livewire-3.x-blue.svg)
![PHP](https://img.shields.io/badge/PHP-8.2+-purple.svg)

---

## 🎯 **Project Overview**

GoalGuessers is a **virtual football betting platform** that simulates a complete football league experience with:
- **20 fantasy teams** with unique names, logos, and statistics
- **380 scheduled matches** across 38 gameweeks
- **Professional betting system** with dynamic odds and balance management
- **Live match simulations** with realistic 5-minute match progression
- **Spanish timezone support** (Europe/Madrid) throughout the platform
- **Tommy Hilfiger color scheme** (Red #DA020E, Blue #004B87, Navy #1A1B3A)

**⚠️ Important:** This platform uses **virtual currency only** - no real money or gambling involved.

---

## 🚀 **Quick Start**

```bash
# Clone and setup
git clone [repository-url]
cd football
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database setup (MySQL in Docker)
docker-compose up -d
php artisan migrate
php artisan db:seed

# Start development
php artisan serve
npm run dev

# Create test user
php artisan tinker
User::create([
    'name' => 'Test User',
    'email' => 'test@goalguessers.com',
    'password' => bcrypt('password'),
    'birth_date' => '1990-01-01',
    'virtual_balance' => 1000.00
]);
```

**Access:** http://localhost:8000
**Login:** test@goalguessers.com / password

---

## 📁 **Project Structure**

### **App Folder (`/app`)**

#### **🎮 Livewire Components (`/app/Livewire`)**

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **`Home.php`** | Main landing page | Match listings, betting interface, live stats |
| **`BetModal.php`** | Professional bet confirmation | Custom amounts (€5-€1000), real-time calculations |
| **`LeagueTable.php`** | League standings | Position tracking, form, goal difference |
| **`FixturesAndResults.php`** | Match scheduling | Advanced filtering, pagination, search |
| **`LiveMatches.php`** | Live match tracking | Real-time updates, match progress |
| **`IndividualMatch.php`** | Single match view | Clean focused display, live updates |
| **`BettingHistory.php`** | User bet tracking | Filtering, statistics, profit/loss |
| **`Dashboard.php`** | User dashboard | Personal stats, recent activity |
| **`Auth/Login.php`** | Authentication | Professional login with validation |
| **`Auth/Register.php`** | User registration | Age verification, terms acceptance |

#### **🗃️ Models (`/app/Models`)**

| Model | Purpose | Key Relationships |
|-------|---------|-------------------|
| **`User.php`** | User management | HasMany: bets, virtual_balance tracking |
| **`Team.php`** | Team data | HasMany: matches, strength_rating, logo_url |
| **`Season.php`** | Season management | HasMany: gameweeks, active season tracking |
| **`Gameweek.php`** | Weekly rounds | HasMany: matches, betting deadlines |
| **`FootballMatch.php`** | Match management | BelongsTo: teams, gameweek, live simulation |
| **`Bet.php`** | Betting system | Professional validation, settlement logic |

#### **⚙️ Services (`/app/Services`)**

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| **`LiveMatchSimulationService.php`** | Live match engine | Realistic 5-min simulations, goal algorithms |
| **`LeagueTableService.php`** | Standings calculation | Points, form tracking, position updates |
| **`MatchSimulationService.php`** | Match result generation | Team strength, Poisson distribution |
| **`NavigationService.php`** | Dynamic navigation | Context-aware menus, live match detection |
| **`UserStatsService.php`** | User statistics | Win rates, profit/loss, recent activity |

#### **💻 Console Commands (`/app/Console/Commands`)**

| Command | Purpose | Usage |
|---------|---------|-------|
| **`StartLiveMatchSimulation.php`** | Start live matches | `php artisan simulation:start {match_id}` |
| **`UpdateLiveMatchSimulations.php`** | Update simulations | `php artisan simulation:update` |
| **`ProcessMatches.php`** | Automated processing | `php artisan matches:process` |

---

### **Database (`/database`)**

#### **📊 Migrations**
- **Core Tables:** users, teams, seasons, gameweeks, matches, bets
- **Live Simulation:** simulation_started_at, current_match_minute, simulation_status
- **Betting System:** virtual_balance, potential_winnings, actual_winnings
- **League Table:** positions, points, form, goal_difference

#### **🌱 Seeders (`/database/seeders`)**

| Seeder | Purpose | Data Created |
|--------|---------|--------------|
| **`DatabaseSeeder.php`** | Master seeder | Orchestrates all seeding |
| **`TeamsSeeder.php`** | Team creation | 20 fantasy teams with logos |
| **`SeasonsAndGameweeksSeeder.php`** | Season structure | 38 gameweeks, 2025/26 season |
| **`MatchesSeeder.php`** | Match scheduling | 380 matches, Spanish timezones |
| **`UserSeeder.php`** | Test users | Default accounts with virtual balance |

---

### **Frontend (`/resources`)**

#### **🎨 Views (`/resources/views`)**

##### **Livewire Components (`/resources/views/livewire`)**

| View | Purpose | Key Features |
|------|---------|--------------|
| **`home.blade.php`** | Main interface | Hero section, match cards, betting buttons |
| **`bet-modal.blade.php`** | Bet confirmation | Professional modal, amount selection |
| **`league-table.blade.php`** | Standings display | Responsive table, color-coded positions |
| **`fixtures-and-results.blade.php`** | Match listings | Filtering, search, pagination |
| **`live-matches.blade.php`** | Live tracking | Real-time updates, match progress |
| **`individual-match.blade.php`** | Single match | Clean focused view, large score display |
| **`betting-history.blade.php`** | Bet tracking | Advanced filtering, statistics cards |
| **`auth/login.blade.php`** | Login form | Professional styling, validation |
| **`auth/register.blade.php`** | Registration | Age verification, terms |

##### **Components (`/resources/views/components`)**

| Component | Purpose | Features |
|-----------|---------|----------|
| **`layouts/app.blade.php`** | Main layout | Navigation, footer, flash messages |
| **`navigation.blade.php`** | Dynamic navbar | Context-aware links, live match detection |

#### **🎨 Styling**
- **TailwindCSS** for utility-first styling
- **Tommy Hilfiger color scheme** (--th-red, --th-blue, --th-navy)
- **Responsive design** optimized for mobile and desktop
- **Professional animations** and transitions

---

### **Public Assets (`/public`)**

#### **🖼️ Images (`/public/images`)**
- **`goalguessers.png`** - Main logo
- **`teams/`** - Team logos for all 20 teams
- **Responsive image loading** and optimization

---

### **Configuration (`/config`)**

#### **⚙️ Key Configurations**
- **`app.php`** - Spanish timezone (Europe/Madrid)
- **`database.php`** - MySQL connection with Docker support
- **`livewire.php`** - Livewire component configuration
- **`tailwind.config.js`** - Tommy Hilfiger color scheme

---

### **Routes (`/routes/web.php`)**

#### **🛣️ Route Structure**

| Route | Component | Access | Purpose |
|-------|-----------|--------|---------|
| **`/`** | Home | Public | Main landing page |
| **`/league-table`** | LeagueTable | Public | League standings |
| **`/fixtures-and-results`** | FixturesAndResults | Public | Match schedules |
| **`/live-matches`** | LiveMatches | Public | Live match tracking |
| **`/match/{id}`** | IndividualMatch | Public | Single match view |
| **`/login`** | Login | Guest | User authentication |
| **`/register`** | Register | Guest | User registration |
| **`/dashboard`** | Dashboard | Auth | User dashboard |
| **`/betting-history`** | BettingHistory | Auth | Bet tracking |

---

## 🎯 **Core Features**

### **🎮 Authentication System**
- **Professional login/register** with validation
- **Age verification** (18+ required)
- **Virtual balance management** (€1,000 starting balance)
- **Session management** and security

### **⚽ Team & Match Management**
- **20 fantasy teams** with unique identities
- **380 pre-scheduled matches** across 38 gameweeks
- **Spanish timezone integration** throughout
- **Dynamic match status** (scheduled, live, finished)

### **🏆 League System**
- **Real-time league table** with positions, points, form
- **Goal difference calculations**
- **Form tracking** (last 5 matches)
- **Color-coded positions** (Champions League, Europa, Relegation)

### **💰 Professional Betting System**

#### **Bet Confirmation Modal**
- **Custom bet amounts** (€5 - €1,000)
- **Quick amount buttons** (€5, €10, €25, €50)
- **Real-time potential winnings** calculation
- **Balance validation** with warnings
- **Professional confirmation flow**

#### **Betting Logic**
- **Dynamic odds calculation** based on team strength
- **Balance validation** and transaction safety
- **Automatic bet settlement** when matches finish
- **Comprehensive bet tracking** and history

### **🔴 Live Match Simulation**
- **Realistic 5-minute simulations** (5 real minutes = 90 match minutes)
- **Time progression:** First Half (0-45') → Half Time → Second Half (45-90') → Extra Time
- **Goal probability algorithm** based on match minute and team strength
- **Real-time updates** every 3-8 seconds
- **Individual match view** with clean focused display

### **📊 User Experience**
- **Personal dashboard** with betting statistics
- **Advanced betting history** with filtering
- **Win rate calculations** and profit/loss tracking
- **Recent activity** and personalized insights

### **🎨 Professional UI/UX**
- **Tommy Hilfiger color scheme** for premium feel
- **Responsive design** optimized for all devices
- **Professional animations** and micro-interactions
- **Intuitive navigation** with context awareness
- **Flash message system** for user feedback

---

## 🛠️ **Technical Architecture**

### **Backend Stack**
- **Laravel 12.30.1** - PHP framework
- **Livewire 3.x** - Full-stack framework
- **MySQL** - Database (Docker containerized)
- **PHP 8.2+** - Backend language

### **Frontend Stack**
- **TailwindCSS** - Utility-first styling
- **Alpine.js** - JavaScript reactivity (via Livewire)
- **Blade Templates** - Server-side templating
- **Vite** - Asset bundling and hot reload

### **Key Design Patterns**
- **Service Layer Architecture** - Business logic separation
- **Repository Pattern** - Data access abstraction
- **Event-Driven Architecture** - Livewire component communication
- **Command Pattern** - Automated match processing

### **Database Design**
- **Normalized schema** with proper relationships
- **Indexes** for performance optimization
- **Constraints** for data integrity
- **Timestamps** with timezone awareness

---

## 🎮 **Gameplay Flow**

### **User Journey**
1. **Registration** → Age verification + €1,000 virtual balance
2. **Browse matches** → View upcoming fixtures with odds
3. **Place bets** → Professional confirmation modal
4. **Track progress** → Live match updates and betting history
5. **View results** → League table updates and bet settlements

### **Match Lifecycle**
1. **Scheduled** → Betting available until kickoff
2. **Live** → 5-minute realistic simulation
3. **Finished** → Automatic bet settlement and league table update

### **Betting Process**
1. **Click bet button** → Opens professional modal
2. **Select amount** → Custom input or quick buttons
3. **Review details** → Match info, odds, potential winnings
4. **Confirm bet** → Balance deducted, bet placed
5. **Track outcome** → Live updates and settlement

---

## 📈 **Performance & Scalability**

### **Optimization Features**
- **Eager loading** relationships to prevent N+1 queries
- **Database indexes** on frequently queried columns
- **Livewire wire:key** for component optimization
- **Asset optimization** with Vite
- **Query caching** for static data

### **Security Measures**
- **Authentication middleware** for protected routes
- **CSRF protection** on all forms
- **Input validation** with Laravel's validation rules
- **Virtual currency** (no real money handling)
- **Rate limiting** on betting actions

---

## 🎯 **Current Status: Fully Functional**

### **✅ Completed Features**
- ✅ **Complete authentication system**
- ✅ **20 teams with 380 scheduled matches**
- ✅ **Professional betting system with modal confirmation**
- ✅ **Real-time league table with form tracking**
- ✅ **Live match simulation engine (5-min realistic)**
- ✅ **Individual match views with clean design**
- ✅ **Advanced betting history with filtering**
- ✅ **User dashboard with personalized statistics**
- ✅ **Responsive design with Tommy Hilfiger theme**
- ✅ **Spanish timezone integration throughout**
- ✅ **Dynamic navigation with context awareness**

### **🏆 Key Achievements**
- **Professional bet confirmation modal** replacing instant betting
- **Custom bet amounts** (€5-€1,000) with real-time calculations
- **Realistic live match simulations** with proper time progression
- **Complete league management** with automatic table updates
- **Comprehensive user experience** with detailed statistics

---

## 🔧 **Development Commands**

### **Live Match Simulation**
```bash
# Start a live match simulation
php artisan simulation:start {match_id}

# Update all active simulations
php artisan simulation:update

# Process scheduled matches
php artisan matches:process
```

### **Database Operations**
```bash
# Fresh migration with seeding
php artisan migrate:fresh --seed

# Seed specific data
php artisan db:seed --class=TeamsSeeder
php artisan db:seed --class=MatchesSeeder
```

### **Development Tools**
```bash
# Laravel development server
php artisan serve

# Watch for asset changes
npm run dev

# Build for production
npm run build
```

---

## 📱 **Browser Compatibility**

- ✅ **Chrome** (80+)
- ✅ **Firefox** (70+)
- ✅ **Safari** (13+)
- ✅ **Edge** (80+)
- ✅ **Mobile browsers** (responsive design)

---

## 🤝 **Contributing**

This is a demonstration project showcasing modern Laravel/Livewire development practices. The codebase demonstrates:

- **Professional component architecture**
- **Service layer implementation**
- **Real-time user interfaces**
- **Complex business logic handling**
- **Modern PHP/Laravel patterns**

---

## 📄 **License**

This project is open-source software licensed under the [MIT license](LICENSE).

---

## 🎯 **Project Philosophy**

GoalGuessers was built to demonstrate how to create a **professional, full-featured web application** using modern Laravel and Livewire. Every component showcases best practices in:

- **Code organization** and architecture
- **User experience** design
- **Database design** and optimization
- **Security** implementation
- **Testing** and validation

The platform proves that **virtual currency gaming** can be both engaging and educational, providing a complete football league experience without real-money gambling risks.

---

*Built with ❤️ using Laravel, Livewire, and TailwindCSS*
*Virtual football betting platform - No real money involved*
