"""
Nationality System for Retro Football Championship
Contains data for top 100 FIFA-ranked football nations with:
- Country codes, names, flags
- First name and last name pools
- Weighted probability for English league player generation
"""

import random
from typing import Dict, Tuple

# ============================================
# TOP 100 FOOTBALL NATIONS (FIFA Ranking Based)
# ============================================

NATIONALITIES: Dict[str, Dict] = {
    # ============================================
    # EUROPE - Western
    # ============================================
    "ENG": {
        "code": "ENG",
        "name": "England",
        "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
        "region": "Europe",
        "first_names": ["James", "Oliver", "Harry", "George", "Noah", "Leo", "Arthur", "Oscar", "Charlie", "Jack", "Lucas", "Freddie", "Alfie", "Henry", "Theo", "Archie", "Ethan", "Isaac", "Jacob", "Max", "William", "Thomas", "Edward", "Alexander", "Daniel", "Matthew", "Ryan", "Luke", "Adam", "Ben"],
        "last_names": ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Taylor", "Anderson", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Hall", "Allen", "Young", "King", "Wright", "Scott", "Green", "Baker", "Adams"],
    },
    "FRA": {
        "code": "FRA",
        "name": "France",
        "flag": "🇫🇷",
        "region": "Europe",
        "first_names": ["Lucas", "Hugo", "Nathan", "Enzo", "Louis", "Gabriel", "Raphaël", "Arthur", "Jules", "Adam", "Mathis", "Léo", "Théo", "Ethan", "Noah", "Timéo", "Mathéo", "Clément", "Maxime", "Antoine", "Kylian", "Ousmane", "Moussa", "Ibrahima", "Mamadou"],
        "last_names": ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "Traoré", "Diallo", "Camara", "Touré", "Koné", "Mbappé", "Dembélé", "Cissé", "Diop", "Kanté"],
    },
    "ESP": {
        "code": "ESP",
        "name": "Spain",
        "flag": "🇪🇸",
        "region": "Europe",
        "first_names": ["Pablo", "Carlos", "Alejandro", "Diego", "Sergio", "Álvaro", "David", "Adrián", "Daniel", "Javier", "Jorge", "Marcos", "Hugo", "Mario", "Iker", "Raúl", "Fernando", "Antonio", "Pedro", "Gonzalo", "Rodri", "Gavi", "Pedri", "Ferran", "Marc"],
        "last_names": ["García", "Rodríguez", "Martínez", "López", "González", "Hernández", "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Reyes", "Moreno", "Muñoz", "Jiménez", "Ruiz", "Álvarez", "Romero", "Navarro", "Ramos", "Gil", "Serrano"],
    },
    "GER": {
        "code": "GER",
        "name": "Germany",
        "flag": "🇩🇪",
        "region": "Europe",
        "first_names": ["Leon", "Felix", "Lukas", "Maximilian", "Paul", "Jonas", "Finn", "Noah", "Elias", "Ben", "Niklas", "Tim", "Julian", "Luca", "Moritz", "Philipp", "David", "Simon", "Jan", "Florian", "Kai", "Timo", "Joshua", "Jamal", "Leroy"],
        "last_names": ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann", "Braun", "Krüger", "Hartmann", "Lange", "Werner"],
    },
    "ITA": {
        "code": "ITA",
        "name": "Italy",
        "flag": "🇮🇹",
        "region": "Europe",
        "first_names": ["Francesco", "Alessandro", "Lorenzo", "Andrea", "Matteo", "Leonardo", "Gabriele", "Riccardo", "Tommaso", "Davide", "Federico", "Marco", "Luca", "Giuseppe", "Giovanni", "Simone", "Antonio", "Nicola", "Filippo", "Stefano", "Gianluigi", "Ciro", "Domenico", "Fabio", "Paolo"],
        "last_names": ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "Costa", "Giordano", "Mancini", "Rizzo", "Lombardi", "Moretti", "Barbieri", "Fontana", "Santoro", "Mariani", "Rinaldi", "Caruso"],
    },
    "POR": {
        "code": "POR",
        "name": "Portugal",
        "flag": "🇵🇹",
        "region": "Europe",
        "first_names": ["João", "Pedro", "Diogo", "Rúben", "Bruno", "Bernardo", "André", "Rafael", "Miguel", "Gonçalo", "Francisco", "Tiago", "Ricardo", "Nuno", "Hugo", "Luís", "Daniel", "Fábio", "Sérgio", "Vítor", "Cristiano", "Renato", "Rui", "Nelson", "Pepe"],
        "last_names": ["Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues", "Martins", "Fernandes", "Gonçalves", "Gomes", "Lopes", "Marques", "Alves", "Almeida", "Ribeiro", "Pinto", "Carvalho", "Teixeira", "Moreira", "Correia", "Mendes", "Nunes", "Sousa", "Vieira"],
    },
    "NED": {
        "code": "NED",
        "name": "Netherlands",
        "flag": "🇳🇱",
        "region": "Europe",
        "first_names": ["Daan", "Sem", "Lucas", "Levi", "Finn", "Milan", "Jesse", "Lars", "Luuk", "Thijs", "Tim", "Thomas", "Max", "Bram", "Ruben", "Sven", "Jasper", "Stijn", "Noah", "Julian", "Frenkie", "Matthijs", "Virgil", "Memphis", "Daley"],
        "last_names": ["de Jong", "de Vries", "van den Berg", "van Dijk", "Bakker", "Janssen", "Visser", "Smit", "Meijer", "de Boer", "Mulder", "de Groot", "Bos", "Vos", "Peters", "Hendriks", "van Leeuwen", "Dekker", "Brouwer", "de Wit", "Dijkstra", "Smeets", "de Graaf", "van der Linden", "Vermeer"],
    },
    "BEL": {
        "code": "BEL",
        "name": "Belgium",
        "flag": "🇧🇪",
        "region": "Europe",
        "first_names": ["Lucas", "Louis", "Noah", "Adam", "Victor", "Arthur", "Liam", "Mathis", "Nathan", "Jules", "Maxime", "Thomas", "Kevin", "Eden", "Romelu", "Thibaut", "Youri", "Axel", "Dries", "Leander", "Thorgan", "Michy", "Nacer", "Divock", "Yannick"],
        "last_names": ["Peeters", "Janssens", "Maes", "Jacobs", "Mertens", "Willems", "Claes", "Goossens", "Wouters", "De Smedt", "Dubois", "Lambert", "Dupont", "Martin", "Simon", "Hazard", "Lukaku", "De Bruyne", "Witsel", "Courtois", "Tielemans", "Carrasco", "Vertonghen", "Alderweireld", "Kompany"],
    },
    # ============================================
    # EUROPE - British Isles
    # ============================================
    "SCO": {
        "code": "SCO",
        "name": "Scotland",
        "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
        "region": "Europe",
        "first_names": ["James", "Jack", "Lewis", "Oliver", "Harris", "Leo", "Noah", "Charlie", "Finlay", "Logan", "Alexander", "Rory", "Callum", "Andrew", "Scott", "Ryan", "John", "Craig", "Stuart", "Ross", "Kieran", "Billy", "Kenny", "Graeme", "Angus"],
        "last_names": ["Smith", "Brown", "Wilson", "Robertson", "Campbell", "Stewart", "Anderson", "MacDonald", "Scott", "Reid", "Murray", "Taylor", "Clark", "Ross", "Young", "Mitchell", "Watson", "Morrison", "Paterson", "Fraser", "McGinn", "McTominay", "Tierney", "McGregor", "Gilmour"],
    },
    "WAL": {
        "code": "WAL",
        "name": "Wales",
        "flag": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
        "region": "Europe",
        "first_names": ["Oliver", "Noah", "Jack", "Jacob", "Leo", "Harry", "Oscar", "George", "Charlie", "Theo", "Dylan", "Rhys", "Owen", "Gareth", "Aaron", "Daniel", "Ethan", "Ben", "David", "Joe", "Connor", "Brennan", "Neco", "Kieffer", "Sorba"],
        "last_names": ["Jones", "Williams", "Davies", "Evans", "Thomas", "Roberts", "Hughes", "Lewis", "Morgan", "Griffiths", "Edwards", "James", "Lloyd", "Owen", "Price", "Rees", "Jenkins", "Phillips", "Morris", "Powell", "Bale", "Ramsey", "Allen", "Moore", "Wilson"],
    },
    "IRL": {
        "code": "IRL",
        "name": "Ireland",
        "flag": "🇮🇪",
        "region": "Europe",
        "first_names": ["Jack", "James", "Noah", "Daniel", "Conor", "Liam", "Luke", "Sean", "Adam", "Harry", "Michael", "Cian", "Fionn", "Oisin", "Darragh", "Patrick", "Ryan", "Evan", "Dylan", "Charlie", "Seamus", "Robbie", "Shane", "Matt", "Callum"],
        "last_names": ["Murphy", "Kelly", "O'Sullivan", "Walsh", "Smith", "O'Brien", "Byrne", "Ryan", "O'Connor", "O'Neill", "O'Reilly", "Doyle", "McCarthy", "Gallagher", "Doherty", "Kennedy", "Lynch", "Murray", "Quinn", "Moore", "Coleman", "Doherty", "Brady", "Duffy", "McClean"],
    },
    # ============================================
    # EUROPE - Scandinavia
    # ============================================
    "DEN": {
        "code": "DEN",
        "name": "Denmark",
        "flag": "🇩🇰",
        "region": "Europe",
        "first_names": ["William", "Noah", "Oscar", "Lucas", "Oliver", "Victor", "Malthe", "Alfred", "Carl", "Emil", "Christian", "Kasper", "Mikkel", "Simon", "Andreas", "Rasmus", "Jonas", "Mathias", "Thomas", "Pierre-Emile", "Joakim", "Joachim", "Jannik", "Alexander", "Yussuf"],
        "last_names": ["Nielsen", "Jensen", "Hansen", "Pedersen", "Andersen", "Christensen", "Larsen", "Sørensen", "Rasmussen", "Petersen", "Madsen", "Kristensen", "Olsen", "Thomsen", "Poulsen", "Møller", "Eriksen", "Kjær", "Schmeichel", "Højbjerg", "Dolberg", "Skov", "Lindstrøm", "Damsgaard", "Braithwaite"],
    },
    "SWE": {
        "code": "SWE",
        "name": "Sweden",
        "flag": "🇸🇪",
        "region": "Europe",
        "first_names": ["Lucas", "Liam", "William", "Elias", "Noah", "Hugo", "Oliver", "Oscar", "Adam", "Axel", "Viktor", "Emil", "Alexander", "Sebastian", "Isak", "Dejan", "Zlatan", "Albin", "Ludwig", "Robin", "Filip", "Jesper", "Mattias", "Marcus", "Victor"],
        "last_names": ["Andersson", "Johansson", "Karlsson", "Nilsson", "Eriksson", "Larsson", "Olsson", "Persson", "Svensson", "Gustafsson", "Pettersson", "Jonsson", "Lindberg", "Lindqvist", "Magnusson", "Forsberg", "Isak", "Kulusevski", "Lindelöf", "Ekdal", "Claesson", "Olsen", "Augustinsson", "Krafth", "Gyökeres"],
    },
    "NOR": {
        "code": "NOR",
        "name": "Norway",
        "flag": "🇳🇴",
        "region": "Europe",
        "first_names": ["Jakob", "Emil", "Noah", "Oliver", "Lucas", "Liam", "William", "Isak", "Oskar", "Filip", "Magnus", "Sander", "Henrik", "Martin", "Erling", "Mats", "Stefan", "Ola", "Jens", "Kristoffer", "Alexander", "Jonas", "Andreas", "Morten", "John"],
        "last_names": ["Hansen", "Johansen", "Olsen", "Larsen", "Andersen", "Pedersen", "Nilsen", "Kristiansen", "Jensen", "Karlsen", "Johnsen", "Pettersen", "Eriksen", "Berg", "Haugen", "Haaland", "Ødegaard", "Sørloth", "Berge", "Nyland", "Ajer", "Meling", "Thorsby", "Elyounoussi", "King"],
    },
    # ============================================
    # EUROPE - Eastern
    # ============================================
    "POL": {
        "code": "POL",
        "name": "Poland",
        "flag": "🇵🇱",
        "region": "Europe",
        "first_names": ["Antoni", "Jakub", "Jan", "Szymon", "Filip", "Aleksander", "Franciszek", "Mikołaj", "Wojciech", "Kacper", "Adam", "Piotr", "Robert", "Kamil", "Arkadiusz", "Grzegorz", "Przemysław", "Krzysztof", "Bartosz", "Mateusz", "Sebastian", "Łukasz", "Dawid", "Paweł", "Maciej"],
        "last_names": ["Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Woźniak", "Dąbrowski", "Kozłowski", "Jankowski", "Mazur", "Kwiatkowski", "Wojciechowski", "Krawczyk", "Piotrowski", "Grabowski", "Pawłowski", "Michalski", "Król", "Wieczorek", "Jabłoński", "Nowakowski"],
    },
    "CRO": {
        "code": "CRO",
        "name": "Croatia",
        "flag": "🇭🇷",
        "region": "Europe",
        "first_names": ["Luka", "Ivan", "Mateo", "Josip", "Marko", "Nikola", "Ante", "Duje", "Bruno", "Lovro", "Mario", "Andrej", "Domagoj", "Šime", "Dejan", "Marcelo", "Joško", "Borna", "Mislav", "Kristijan", "Martin", "Filip", "Dominik", "Antonio", "Petar"],
        "last_names": ["Horvat", "Kovačević", "Babić", "Marić", "Jurić", "Novak", "Kovač", "Knežević", "Vuković", "Marković", "Perić", "Matić", "Tomić", "Pavlović", "Božić", "Modrić", "Perišić", "Rebić", "Brozović", "Gvardiol", "Kramarić", "Kovačić", "Lovren", "Vlašić", "Livaković"],
    },
    "SRB": {
        "code": "SRB",
        "name": "Serbia",
        "flag": "🇷🇸",
        "region": "Europe",
        "first_names": ["Luka", "Nikola", "Stefan", "Marko", "Aleksandar", "Nemanja", "Dušan", "Filip", "Miloš", "Vanja", "Predrag", "Dejan", "Branislav", "Sergej", "Andrija", "Mijat", "Darko", "Saša", "Ivan", "Uroš", "Lazar", "Petar", "Vladimir", "Veljko", "Strahinja"],
        "last_names": ["Jovanović", "Petrović", "Nikolić", "Marković", "Đorđević", "Stojanović", "Ilić", "Stanković", "Pavlović", "Milošević", "Tadić", "Vlahović", "Mitrović", "Kostić", "Milinković-Savić", "Živković", "Lukić", "Pavković", "Ristić", "Radonjić", "Gudelj", "Rajković", "Vidić", "Matić", "Ivanović"],
    },
    "UKR": {
        "code": "UKR",
        "name": "Ukraine",
        "flag": "🇺🇦",
        "region": "Europe",
        "first_names": ["Oleksandr", "Andriy", "Mykola", "Viktor", "Taras", "Roman", "Yevhen", "Vitaliy", "Ruslan", "Denys", "Serhiy", "Artem", "Bohdan", "Dmytro", "Eduard", "Illya", "Georgiy", "Mykhailo", "Oleksiy", "Vladyslav", "Anatoliy", "Heorhiy", "Maksym", "Yaroslav", "Pavlo"],
        "last_names": ["Shevchenko", "Kovalenko", "Bondarenko", "Tkachenko", "Kravchenko", "Oliynyk", "Shevchuk", "Kovalchuk", "Polishchuk", "Boyko", "Zinchenko", "Mudryk", "Malinovskyi", "Yarmolenko", "Mykolenko", "Tsygankov", "Dovbyk", "Zabarnyi", "Sydorchuk", "Matviyenko", "Lunin", "Trubin", "Shaparenko", "Stepanenko", "Yaremchuk"],
    },
    "CZE": {
        "code": "CZE",
        "name": "Czech Republic",
        "flag": "🇨🇿",
        "region": "Europe",
        "first_names": ["Jakub", "Jan", "Tomáš", "Adam", "Matěj", "Filip", "Vojtěch", "Lukáš", "Ondřej", "David", "Daniel", "Patrik", "Vladimír", "Pavel", "Petr", "Michal", "Martin", "Antonín", "Václav", "Ladislav", "Alex", "Mojmír", "Theodor", "Aleš", "Radek"],
        "last_names": ["Novák", "Svoboda", "Novotný", "Dvořák", "Černý", "Procházka", "Kučera", "Veselý", "Horák", "Němec", "Schick", "Souček", "Coufal", "Hložek", "Barák", "Jankto", "Krejčí", "Vydra", "Darida", "Masopust", "Král", "Zima", "Staněk", "Vacek", "Provod"],
    },
    "SUI": {
        "code": "SUI",
        "name": "Switzerland",
        "flag": "🇨🇭",
        "region": "Europe",
        "first_names": ["Noah", "Liam", "Luca", "Leon", "David", "Levin", "Elias", "Gabriel", "Samuel", "Julian", "Nico", "Matteo", "Jan", "Fabian", "Yann", "Xherdan", "Granit", "Haris", "Breel", "Manuel", "Remo", "Denis", "Ricardo", "Ruben", "Silvan"],
        "last_names": ["Müller", "Meier", "Schmid", "Keller", "Weber", "Huber", "Schneider", "Meyer", "Steiner", "Fischer", "Gerber", "Brunner", "Baumann", "Frei", "Zimmermann", "Shaqiri", "Xhaka", "Seferovic", "Embolo", "Akanji", "Rodriguez", "Sommer", "Schär", "Elvedi", "Freuler"],
    },
    "TUR": {
        "code": "TUR",
        "name": "Turkey",
        "flag": "🇹🇷",
        "region": "Europe",
        "first_names": ["Yusuf", "Eyüp", "Ömer", "Mustafa", "Emir", "Kerem", "Arda", "Hakan", "Cengiz", "Burak", "Cenk", "Ozan", "Çağlar", "Mert", "Okay", "Dorukhan", "Irfan", "Umut", "Enes", "Kaan", "Salih", "Zeki", "Berkan", "Barış", "Orkun"],
        "last_names": ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir", "Aktürkoğlu", "Çalhanoğlu", "Söyüncü", "Ünder", "Tosun", "Günok", "Kabak", "Yazıcı", "Kökcü", "Demiral", "Karaman", "Kutlu", "Özcan", "Müldür", "Bardakcı"],
    },
    "GRE": {
        "code": "GRE",
        "name": "Greece",
        "flag": "🇬🇷",
        "region": "Europe",
        "first_names": ["Georgios", "Dimitrios", "Konstantinos", "Ioannis", "Nikolaos", "Panagiotis", "Christos", "Athanasios", "Vasileios", "Michail", "Alexandros", "Evangelos", "Kostas", "Sokratis", "Giannis", "Anastasios", "Fotis", "Manolis", "Dimitris", "Petros", "Lazaros", "Tasos", "Vangelis", "Thanasis", "Efthymios"],
        "last_names": ["Papadopoulos", "Papadakis", "Papanikolaou", "Georgiou", "Nikolaou", "Konstantinidis", "Dimitriou", "Oikonomou", "Vasileiou", "Alexiou", "Mavropanos", "Tzolis", "Masouras", "Bakasetas", "Pavlidis", "Fortounis", "Mantalos", "Vlachodimos", "Giannoulis", "Tsimikas", "Siovas", "Limnios", "Pelkas", "Douvikas", "Ioannidis"],
    },
    # ============================================
    # SOUTH AMERICA
    # ============================================
    "BRA": {
        "code": "BRA",
        "name": "Brazil",
        "flag": "🇧🇷",
        "region": "South America",
        "first_names": ["Lucas", "Gabriel", "Matheus", "Felipe", "Rafael", "Guilherme", "Pedro", "Bruno", "Leonardo", "Vinícius", "Neymar", "Thiago", "Casemiro", "Marquinhos", "Richarlison", "Rodrygo", "Raphinha", "Fabinho", "Alisson", "Ederson", "Antony", "Endrick", "Éder", "Danilo", "Alex"],
        "last_names": ["Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Ferreira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Araújo", "Ribeiro", "Gomes", "Martins", "Carvalho", "Rocha", "Vieira", "Barbosa", "Moura", "Paquetá", "Militão", "Bremer", "Martinelli", "Firmino"],
    },
    "ARG": {
        "code": "ARG",
        "name": "Argentina",
        "flag": "🇦🇷",
        "region": "South America",
        "first_names": ["Lionel", "Ángel", "Paulo", "Gonzalo", "Sergio", "Nicolás", "Rodrigo", "Leandro", "Emiliano", "Julián", "Lautaro", "Alejandro", "Enzo", "Alexis", "Cristian", "Marcos", "Lisandro", "Nahuel", "Germán", "Guido", "Exequiel", "Giovanni", "Thiago", "Valentín", "Matías"],
        "last_names": ["González", "Rodríguez", "Fernández", "López", "Martínez", "García", "Pérez", "Sánchez", "Romero", "Díaz", "Messi", "Di María", "Dybala", "Álvarez", "Paredes", "De Paul", "Mac Allister", "Otamendi", "Tagliafico", "Molina", "Rulli", "Palacios", "Garnacho", "Correa", "Acuña"],
    },
    "COL": {
        "code": "COL",
        "name": "Colombia",
        "flag": "🇨🇴",
        "region": "South America",
        "first_names": ["Juan", "Santiago", "Sebastián", "Samuel", "Mateo", "Nicolás", "Daniel", "Andrés", "David", "Luis", "James", "Radamel", "Yerry", "Davinson", "Jhon", "Jefferson", "Wilmar", "Mateus", "Jorge", "Rafael", "Duván", "Miguel", "Carlos", "Camilo", "Kevin"],
        "last_names": ["Rodríguez", "García", "Martínez", "López", "González", "Hernández", "Sánchez", "Pérez", "Gómez", "Díaz", "Cuadrado", "Falcao", "Mina", "Sánchez", "Arias", "Lerma", "Barrios", "Uribe", "Zapata", "Borré", "Muriel", "Mojica", "Ospina", "Vargas", "Sinisterra"],
    },
    "URU": {
        "code": "URU",
        "name": "Uruguay",
        "flag": "🇺🇾",
        "region": "South America",
        "first_names": ["Juan", "Matías", "Santiago", "Nicolás", "Luis", "Diego", "Federico", "Rodrigo", "Martín", "José", "Edinson", "Darwin", "Ronald", "Sebastián", "Giorgian", "Manuel", "Maxi", "Facundo", "Mathías", "Agustín", "Fernando", "Gastón", "Nahitan", "Lucas", "Guillermo"],
        "last_names": ["González", "Rodríguez", "Martínez", "García", "Fernández", "López", "Pérez", "Suárez", "Silva", "Díaz", "Cavani", "Núñez", "Araujo", "Valverde", "Bentancur", "De Arrascaeta", "Godín", "Giménez", "Coates", "Muslera", "Cáceres", "Torreira", "Vecino", "Pellistri", "Ugarte"],
    },
    "CHI": {
        "code": "CHI",
        "name": "Chile",
        "flag": "🇨🇱",
        "region": "South America",
        "first_names": ["Benjamín", "Martín", "Matías", "Joaquín", "Agustín", "Lucas", "Vicente", "Tomás", "Sebastián", "Felipe", "Alexis", "Arturo", "Charles", "Eduardo", "Gary", "Erick", "Guillermo", "Mauricio", "Claudio", "Marcelo", "Ben", "Marcelino", "Diego", "Víctor", "Pablo"],
        "last_names": ["González", "Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Contreras", "Silva", "Martínez", "Sepúlveda", "Sánchez", "Vidal", "Aránguiz", "Vargas", "Medel", "Bravo", "Isla", "Maripán", "Brereton", "Palacios", "Núñez", "Dávila", "Osorio", "Tapia", "Galdames"],
    },
    "ECU": {
        "code": "ECU",
        "name": "Ecuador",
        "flag": "🇪🇨",
        "region": "South America",
        "first_names": ["Mateo", "Santiago", "Sebastián", "Emiliano", "Martín", "Lucas", "Dylan", "Iker", "Thiago", "Samuel", "Moisés", "Pervis", "Gonzalo", "Enner", "Angelo", "Jeremy", "Michael", "Byron", "Piero", "Carlos", "Robert", "Jefferson", "Jhegson", "Alan", "Kevin"],
        "last_names": ["García", "Rodríguez", "Martínez", "López", "González", "Hernández", "Pérez", "Sánchez", "Ramírez", "Torres", "Caicedo", "Estupiñán", "Plata", "Valencia", "Preciado", "Hincapié", "Cifuentes", "Méndez", "Arboleda", "Galíndez", "Franco", "Estrada", "Reasco", "Páez", "Sarmiento"],
    },
    # ============================================
    # AFRICA
    # ============================================
    "NGA": {
        "code": "NGA",
        "name": "Nigeria",
        "flag": "🇳🇬",
        "region": "Africa",
        "first_names": ["Chukwuemeka", "Oluwaseun", "Adebayo", "Emeka", "Chidera", "Victor", "Samuel", "Kelechi", "Wilfred", "Alex", "Ahmed", "Ola", "William", "Joe", "Calvin", "Moses", "Taiwo", "Leon", "Frank", "Kenneth", "Emmanuel", "Cyriel", "Bright", "Zaidu", "Terem"],
        "last_names": ["Okonkwo", "Adeyemi", "Okoro", "Nwankwo", "Eze", "Uche", "Chukwu", "Okafor", "Ibrahim", "Mohammed", "Osimhen", "Iheanacho", "Ndidi", "Lookman", "Awoniyi", "Onyeka", "Bassey", "Aribo", "Iwobi", "Simon", "Chukwueze", "Aina", "Ekong", "Sanusi", "Moffi"],
    },
    "SEN": {
        "code": "SEN",
        "name": "Senegal",
        "flag": "🇸🇳",
        "region": "Africa",
        "first_names": ["Mamadou", "Moussa", "Cheikh", "Ibrahima", "Abdoulaye", "Sadio", "Kalidou", "Idrissa", "Pape", "Boulaye", "Ismaïla", "Edouard", "Krépin", "Famara", "Nampalys", "Fodé", "Iliman", "Pathé", "Habib", "Nicolas", "Saliou", "Youssouf", "Lamine", "Aliou", "Demba"],
        "last_names": ["Diallo", "Diop", "Ndiaye", "Fall", "Sow", "Sarr", "Gueye", "Ba", "Mbaye", "Cissé", "Mané", "Koulibaly", "Mendy", "Kouyaté", "Diouf", "Baldé", "Diatta", "Jakobs", "Dia", "Seck", "Gomis", "Sabaly", "Pape", "Ndao", "Camara"],
    },
    "GHA": {
        "code": "GHA",
        "name": "Ghana",
        "flag": "🇬🇭",
        "region": "Africa",
        "first_names": ["Thomas", "Jordan", "Mohammed", "Daniel", "Andre", "Alexander", "Inaki", "Tariq", "Antoine", "Abdul", "Jeffrey", "Kamaldeen", "Elisha", "Lawrence", "Joseph", "Baba", "Alidu", "Gideon", "Dennis", "Jonathan", "Edmund", "Osman", "Salis", "Ibrahim", "Felix"],
        "last_names": ["Partey", "Ayew", "Kudus", "Amartey", "Djiku", "Williams", "Lamptey", "Semenyo", "Sulemana", "Owusu", "Schlupp", "Ati-Zigi", "Afena-Gyan", "Kyereh", "Mensah", "Abdul Rahman", "Seidu", "Addo", "Boateng", "Paintsil", "Wakaso", "Nuhu", "Bukari", "Mohammed", "Opoku"],
    },
    "CIV": {
        "code": "CIV",
        "name": "Ivory Coast",
        "flag": "🇨🇮",
        "region": "Africa",
        "first_names": ["Serge", "Nicolas", "Franck", "Wilfried", "Simon", "Jean-Philippe", "Maxwel", "Ibrahim", "Sébastien", "Odilon", "Yves", "Christian", "Jeremie", "Max-Alain", "Evan", "Karim", "Trevoh", "Oumar", "Seko", "Willy", "Ghislain", "Emmanuel", "Ange", "Cheick", "Hassane"],
        "last_names": ["Aurier", "Pépé", "Kessié", "Zaha", "Adingra", "Gbamin", "Cornet", "Sangaré", "Haller", "Koné", "Deli", "Boli", "Gradel", "Diomandé", "Bamba", "Fofana", "Chalobah", "Diakité", "Coulibaly", "Touré", "Konan", "N'Dri", "Tiehi", "Kamara", "Bayo"],
    },
    "MAR": {
        "code": "MAR",
        "name": "Morocco",
        "flag": "🇲🇦",
        "region": "Africa",
        "first_names": ["Youssef", "Adam", "Mohamed", "Ayoub", "Yassine", "Anas", "Hamza", "Achraf", "Sofiane", "Nayef", "Hakim", "Noussair", "Romain", "Azzedine", "Ilias", "Abderrazak", "Selim", "Brahim", "Jawad", "Zakaria", "Sofyan", "Bilal", "Munir", "Walid", "Faycal"],
        "last_names": ["El Amrani", "Bennani", "Idrissi", "Alaoui", "Tazi", "Berrada", "Fassi", "El Ouazzani", "Chaoui", "Ziyech", "Hakimi", "Mazraoui", "Boufal", "Amrabat", "Ounahi", "En-Nesyri", "Aguerd", "Saiss", "Bounou", "El Kaabi", "Diaz", "Ezzalzouli", "Chair", "Cheddira", "Hadj Moussa"],
    },
    "EGY": {
        "code": "EGY",
        "name": "Egypt",
        "flag": "🇪🇬",
        "region": "Africa",
        "first_names": ["Mohamed", "Ahmed", "Omar", "Youssef", "Adam", "Ali", "Mahmoud", "Mostafa", "Karim", "Ziad", "Trézéguet", "Marwan", "Amr", "Ibrahim", "Emam", "Hamdi", "Ayman", "Akram", "Tarek", "Nabil", "Ramadan", "Fathi", "Hossam", "Trezeguet", "Zizo"],
        "last_names": ["Salah", "El-Nenny", "Hegazy", "Trezeguet", "Sobhi", "Ashour", "Fathy", "Mohsen", "El-Shenawy", "Kamal", "Hassan", "Elneny", "Warda", "Marmoush", "Mostafa", "Kouka", "Hamdy", "Attia", "Gabr", "Said", "Abo-Gabal", "Farouk", "Emam", "Samy", "Adel"],
    },
    "CMR": {
        "code": "CMR",
        "name": "Cameroon",
        "flag": "🇨🇲",
        "region": "Africa",
        "first_names": ["Samuel", "Eric", "Vincent", "Andre", "Jean-Pierre", "Karl", "Bryan", "Collins", "Martin", "Pierre", "Nicolas", "Olivier", "Christian", "Michael", "Jean", "Georges", "Moumi", "Arnaud", "Frank", "Ignatius", "Kevin", "Jerome", "Harold", "Enzo", "James"],
        "last_names": ["Eto'o", "Aboubakar", "Choupo-Moting", "Onana", "Toko Ekambi", "Anguissa", "Mbeumo", "Fai", "Castelletto", "Ngamaleu", "Hongla", "Kunde", "Bassogog", "Nkoulou", "Njie", "Ganago", "Marou", "Moukoudi", "N'Koudou", "Mbarga", "Ondoua", "Tchamba", "Mbekeli", "Song", "Epassy"],
    },
    # ============================================
    # ASIA
    # ============================================
    "JPN": {
        "code": "JPN",
        "name": "Japan",
        "flag": "🇯🇵",
        "region": "Asia",
        "first_names": ["Takumi", "Kaoru", "Daichi", "Takehiro", "Yuki", "Keisuke", "Shinji", "Hiroki", "Maya", "Gaku", "Ritsu", "Wataru", "Junya", "Ko", "Ayase", "Hidemasa", "Shuichi", "Yuya", "Takefusa", "Ao", "Mao", "Keito", "Koki", "Shuto", "Yuta"],
        "last_names": ["Minamino", "Mitoma", "Kamada", "Tomiyasu", "Soma", "Honda", "Kagawa", "Sakai", "Yoshida", "Shibasaki", "Doan", "Endo", "Ito", "Itakura", "Ueda", "Morita", "Gonda", "Tanaka", "Kubo", "Machino", "Maeda", "Hosoya", "Nakamura", "Suzuki", "Inoue"],
    },
    "KOR": {
        "code": "KOR",
        "name": "South Korea",
        "flag": "🇰🇷",
        "region": "Asia",
        "first_names": ["Heung-min", "Min-jae", "Woo-yeong", "Hwang", "Jae-sung", "Sang-ho", "Jin-su", "Seung-ho", "In-beom", "Gue-sung", "Hee-chan", "Chang-hoon", "Tae-hwan", "Yong-woo", "Dong-jin", "Young-gwon", "Seung-woo", "Kang-in", "Ji-sung", "Moon-hwan", "Kyung-won", "Jun-ho", "Hyun-soo", "Ui-jo", "Min-hyeok"],
        "last_names": ["Son", "Kim", "Lee", "Park", "Hwang", "Jung", "Cho", "Jeong", "Kwon", "Hong", "Na", "Seol", "Koo", "Oh", "Yang", "Yoon", "Jang", "Paik", "Go", "Bae", "Han", "Moon", "Choi", "Baek", "Ryu"],
    },
    "IRN": {
        "code": "IRN",
        "name": "Iran",
        "flag": "🇮🇷",
        "region": "Asia",
        "first_names": ["Alireza", "Mehdi", "Sardar", "Karim", "Morteza", "Saman", "Ehsan", "Ali", "Omid", "Ramin", "Ahmad", "Milad", "Saeid", "Vahid", "Allahyar", "Shoja", "Ashkan", "Hossein", "Mohammad", "Reza", "Amir", "Siavash", "Kaveh", "Majid", "Sadegh"],
        "last_names": ["Jahanbakhsh", "Taremi", "Azmoun", "Ansarifard", "Pouraliganji", "Ghoddos", "Hajsafi", "Karimi", "Daei", "Rezaeian", "Mohammadi", "Hosseini", "Ebrahimi", "Amiri", "Sayyadmanesh", "Khalilzadeh", "Dejagah", "Nourollahi", "Beiranvand", "Abedzadeh", "Niazmand", "Gholizadeh", "Torabi", "Ezatolahi", "Moharrami"],
    },
    "AUS": {
        "code": "AUS",
        "name": "Australia",
        "flag": "🇦🇺",
        "region": "Asia",
        "first_names": ["Oliver", "William", "Jack", "Noah", "Leo", "Harry", "Charlie", "Thomas", "James", "Henry", "Aaron", "Mathew", "Mitchell", "Ajdin", "Jackson", "Riley", "Kye", "Keanu", "Cameron", "Bailey", "Awer", "Martin", "Nathaniel", "Craig", "Aziz"],
        "last_names": ["Mooy", "Ryan", "Leckie", "Duke", "Irvine", "Rogic", "Hrustic", "Behich", "McGree", "Souttar", "Mabil", "Boyle", "Maclaren", "Kuol", "Wright", "Atkinson", "King", "Deng", "Rowles", "Goodwin", "Devlin", "Tilio", "Metcalfe", "Baccus", "Circati"],
    },
    # ============================================
    # NORTH AMERICA
    # ============================================
    "USA": {
        "code": "USA",
        "name": "United States",
        "flag": "🇺🇸",
        "region": "North America",
        "first_names": ["Christian", "Weston", "Tyler", "Giovanni", "Brenden", "Sergino", "Yunus", "Timothy", "Josh", "Jesús", "Walker", "Chris", "Jordan", "Kellyn", "Johnny", "Brandon", "Folarin", "Malik", "Cameron", "Joe", "Ricardo", "Antonee", "Miles", "Haji", "Brendan"],
        "last_names": ["Pulisic", "McKennie", "Adams", "Reyna", "Aaronson", "Dest", "Musah", "Weah", "Sargent", "Ferreira", "Zimmerman", "Richards", "Morris", "Acosta", "Cardoso", "Vazquez", "Balogun", "Tillman", "Carter-Vickers", "Scally", "Pepi", "Robinson", "Turner", "Wright", "Ream"],
    },
    "MEX": {
        "code": "MEX",
        "name": "Mexico",
        "flag": "🇲🇽",
        "region": "North America",
        "first_names": ["Raúl", "Hirving", "Edson", "César", "Diego", "Guillermo", "Andrés", "Jesús", "Alexis", "Orbelín", "Carlos", "Luis", "Uriel", "Johan", "Héctor", "Jorge", "Roberto", "Kevin", "Santiago", "Gerardo", "Erick", "Fernando", "Alan", "Rodolfo", "Henry"],
        "last_names": ["Jiménez", "Lozano", "Álvarez", "Montes", "Lainez", "Ochoa", "Guardado", "Corona", "Vega", "Pineda", "Rodríguez", "Chávez", "Antuna", "Vásquez", "Moreno", "Sánchez", "Alvarado", "Gutiérrez", "Giménez", "Arteaga", "Romo", "Beltrán", "Pulido", "Cota", "Martín"],
    },
    "CAN": {
        "code": "CAN",
        "name": "Canada",
        "flag": "🇨🇦",
        "region": "North America",
        "first_names": ["Alphonso", "Jonathan", "Cyle", "Tajon", "Stephen", "Alistair", "Samuel", "Richie", "Mark-Anthony", "Kamal", "Liam", "Derek", "Scott", "Maxime", "Atiba", "Junior", "Luca", "Ismaël", "Theo", "Ali", "Milan", "David", "Charles-Andreas", "Jacob", "Kyle"],
        "last_names": ["Davies", "David", "Larin", "Buchanan", "Eustáquio", "Johnston", "Piette", "Laryea", "Kaye", "Miller", "Fraser", "Cornelius", "Kennedy", "Crépeau", "Hutchinson", "Hoilett", "Kone", "Koné", "Corbeanu", "Ahmed", "Borjan", "Wotherspoon", "Brault-Guillard", "Shaffelburg", "Lareya"],
    },
}

# ============================================
# NATIONALITY WEIGHTS FOR ENGLISH LEAGUE
# ============================================
NATIONALITY_WEIGHTS: Dict[str, float] = {
    # England - 35%
    "ENG": 0.35,
    
    # British Isles - 8%
    "SCO": 0.025,
    "WAL": 0.025,
    "IRL": 0.02,
    
    # Western Europe - 18%
    "FRA": 0.04,
    "ESP": 0.03,
    "GER": 0.025,
    "ITA": 0.02,
    "POR": 0.025,
    "NED": 0.02,
    "BEL": 0.02,
    
    # Scandinavia - 4%
    "DEN": 0.012,
    "SWE": 0.012,
    "NOR": 0.012,
    
    # Eastern Europe - 6%
    "POL": 0.012,
    "CRO": 0.01,
    "SRB": 0.008,
    "UKR": 0.008,
    "CZE": 0.006,
    "SUI": 0.006,
    "TUR": 0.006,
    "GRE": 0.004,
    
    # South America - 12%
    "BRA": 0.04,
    "ARG": 0.03,
    "COL": 0.015,
    "URU": 0.015,
    "ECU": 0.01,
    "CHI": 0.01,
    
    # Africa - 10%
    "NGA": 0.025,
    "SEN": 0.02,
    "GHA": 0.015,
    "CIV": 0.01,
    "MAR": 0.01,
    "EGY": 0.01,
    "CMR": 0.01,
    
    # Asia & Oceania - 4%
    "JPN": 0.015,
    "KOR": 0.01,
    "AUS": 0.01,
    "IRN": 0.005,
    
    # North America - 3%
    "USA": 0.015,
    "MEX": 0.01,
    "CAN": 0.005,
}


def get_random_nationality() -> Dict:
    """Get a random nationality based on weights"""
    rand = random.random()
    cumulative = 0.0
    
    for code, weight in NATIONALITY_WEIGHTS.items():
        cumulative += weight
        if rand < cumulative and code in NATIONALITIES:
            return NATIONALITIES[code]
    
    # Fallback to England
    return NATIONALITIES["ENG"]


def generate_player_name(nationality: Dict) -> str:
    """Generate a player name for a given nationality"""
    first_name = random.choice(nationality["first_names"])
    last_name = random.choice(nationality["last_names"])
    return f"{first_name} {last_name}"


def get_nationality_by_code(code: str) -> Dict:
    """Get a nationality by its code"""
    return NATIONALITIES.get(code, NATIONALITIES["ENG"])
