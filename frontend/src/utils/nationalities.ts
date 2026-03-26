/**
 * Nationality System for Retro Football Championship
 * 
 * Contains data for top 100 FIFA-ranked football nations with:
 * - Country codes, names, flags
 * - Region classification
 * - First name and last name pools
 * - Weighted probability for English league player generation
 */

export interface Nationality {
  code: string;
  name: string;
  flag: string;
  region: string;
  firstNames: string[];
  lastNames: string[];
}

// ============================================
// TOP 100 FOOTBALL NATIONS (FIFA Ranking Based)
// ============================================

export const NATIONALITIES: Record<string, Nationality> = {
  // ============================================
  // EUROPE - Western
  // ============================================
  ENG: {
    code: 'ENG',
    name: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    region: 'Europe',
    firstNames: ['James', 'Oliver', 'Harry', 'George', 'Noah', 'Leo', 'Arthur', 'Oscar', 'Charlie', 'Jack', 'Lucas', 'Freddie', 'Alfie', 'Henry', 'Theo', 'Archie', 'Ethan', 'Isaac', 'Jacob', 'Max', 'William', 'Thomas', 'Edward', 'Alexander', 'Daniel', 'Matthew', 'Ryan', 'Luke', 'Adam', 'Ben'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams'],
  },
  FRA: {
    code: 'FRA',
    name: 'France',
    flag: '🇫🇷',
    region: 'Europe',
    firstNames: ['Lucas', 'Hugo', 'Nathan', 'Enzo', 'Louis', 'Gabriel', 'Raphaël', 'Arthur', 'Jules', 'Adam', 'Mathis', 'Léo', 'Théo', 'Ethan', 'Noah', 'Timéo', 'Mathéo', 'Clément', 'Maxime', 'Antoine', 'Kylian', 'Ousmane', 'Moussa', 'Ibrahima', 'Mamadou'],
    lastNames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'Traoré', 'Diallo', 'Camara', 'Touré', 'Koné', 'Mbappé', 'Dembélé', 'Cissé', 'Diop', 'Kanté'],
  },
  ESP: {
    code: 'ESP',
    name: 'Spain',
    flag: '🇪🇸',
    region: 'Europe',
    firstNames: ['Pablo', 'Carlos', 'Alejandro', 'Diego', 'Sergio', 'Álvaro', 'David', 'Adrián', 'Daniel', 'Javier', 'Jorge', 'Marcos', 'Hugo', 'Mario', 'Iker', 'Raúl', 'Fernando', 'Antonio', 'Pedro', 'Gonzalo', 'Rodri', 'Gavi', 'Pedri', 'Ferran', 'Marc'],
    lastNames: ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Moreno', 'Muñoz', 'Jiménez', 'Ruiz', 'Álvarez', 'Romero', 'Navarro', 'Ramos', 'Gil', 'Serrano'],
  },
  GER: {
    code: 'GER',
    name: 'Germany',
    flag: '🇩🇪',
    region: 'Europe',
    firstNames: ['Leon', 'Felix', 'Lukas', 'Maximilian', 'Paul', 'Jonas', 'Finn', 'Noah', 'Elias', 'Ben', 'Niklas', 'Tim', 'Julian', 'Luca', 'Moritz', 'Philipp', 'David', 'Simon', 'Jan', 'Florian', 'Kai', 'Timo', 'Joshua', 'Jamal', 'Leroy'],
    lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hartmann', 'Lange', 'Werner'],
  },
  ITA: {
    code: 'ITA',
    name: 'Italy',
    flag: '🇮🇹',
    region: 'Europe',
    firstNames: ['Francesco', 'Alessandro', 'Lorenzo', 'Andrea', 'Matteo', 'Leonardo', 'Gabriele', 'Riccardo', 'Tommaso', 'Davide', 'Federico', 'Marco', 'Luca', 'Giuseppe', 'Giovanni', 'Simone', 'Antonio', 'Nicola', 'Filippo', 'Stefano', 'Gianluigi', 'Ciro', 'Domenico', 'Fabio', 'Paolo'],
    lastNames: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso'],
  },
  POR: {
    code: 'POR',
    name: 'Portugal',
    flag: '🇵🇹',
    region: 'Europe',
    firstNames: ['João', 'Pedro', 'Diogo', 'Rúben', 'Bruno', 'Bernardo', 'André', 'Rafael', 'Miguel', 'Gonçalo', 'Francisco', 'Tiago', 'Ricardo', 'Nuno', 'Hugo', 'Luís', 'Daniel', 'Fábio', 'Sérgio', 'Vítor', 'Cristiano', 'Renato', 'Rui', 'Nelson', 'Pepe'],
    lastNames: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Sousa', 'Vieira'],
  },
  NED: {
    code: 'NED',
    name: 'Netherlands',
    flag: '🇳🇱',
    region: 'Europe',
    firstNames: ['Daan', 'Sem', 'Lucas', 'Levi', 'Finn', 'Milan', 'Jesse', 'Lars', 'Luuk', 'Thijs', 'Tim', 'Thomas', 'Max', 'Bram', 'Ruben', 'Sven', 'Jasper', 'Stijn', 'Noah', 'Julian', 'Frenkie', 'Matthijs', 'Virgil', 'Memphis', 'Daley'],
    lastNames: ['de Jong', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Wit', 'Dijkstra', 'Smeets', 'de Graaf', 'van der Linden', 'Vermeer'],
  },
  BEL: {
    code: 'BEL',
    name: 'Belgium',
    flag: '🇧🇪',
    region: 'Europe',
    firstNames: ['Lucas', 'Louis', 'Noah', 'Adam', 'Victor', 'Arthur', 'Liam', 'Mathis', 'Nathan', 'Jules', 'Maxime', 'Thomas', 'Kevin', 'Eden', 'Romelu', 'Thibaut', 'Youri', 'Axel', 'Dries', 'Leander', 'Thorgan', 'Michy', 'Nacer', 'Divock', 'Yannick'],
    lastNames: ['Peeters', 'Janssens', 'Maes', 'Jacobs', 'Mertens', 'Willems', 'Claes', 'Goossens', 'Wouters', 'De Smedt', 'Dubois', 'Lambert', 'Dupont', 'Martin', 'Simon', 'Hazard', 'Lukaku', 'De Bruyne', 'Witsel', 'Courtois', 'Tielemans', 'Carrasco', 'Vertonghen', 'Alderweireld', 'Kompany'],
  },
  SUI: {
    code: 'SUI',
    name: 'Switzerland',
    flag: '🇨🇭',
    region: 'Europe',
    firstNames: ['Noah', 'Liam', 'Luca', 'Leon', 'David', 'Levin', 'Elias', 'Gabriel', 'Samuel', 'Julian', 'Nico', 'Matteo', 'Jan', 'Fabian', 'Yann', 'Xherdan', 'Granit', 'Haris', 'Breel', 'Manuel', 'Remo', 'Denis', 'Ricardo', 'Ruben', 'Silvan'],
    lastNames: ['Müller', 'Meier', 'Schmid', 'Keller', 'Weber', 'Huber', 'Schneider', 'Meyer', 'Steiner', 'Fischer', 'Gerber', 'Brunner', 'Baumann', 'Frei', 'Zimmermann', 'Shaqiri', 'Xhaka', 'Seferovic', 'Embolo', 'Akanji', 'Rodriguez', 'Sommer', 'Schär', 'Elvedi', 'Freuler'],
  },
  AUT: {
    code: 'AUT',
    name: 'Austria',
    flag: '🇦🇹',
    region: 'Europe',
    firstNames: ['Maximilian', 'Paul', 'David', 'Felix', 'Jakob', 'Elias', 'Lukas', 'Leon', 'Tobias', 'Luca', 'Jonas', 'Alexander', 'Sebastian', 'Florian', 'Michael', 'Marko', 'Marcel', 'Konrad', 'Stefan', 'Martin', 'Christoph', 'Patrick', 'Kevin', 'Philipp', 'Nicolas'],
    lastNames: ['Gruber', 'Huber', 'Bauer', 'Wagner', 'Müller', 'Pichler', 'Steiner', 'Moser', 'Mayer', 'Hofer', 'Leitner', 'Berger', 'Fuchs', 'Eder', 'Fischer', 'Schmid', 'Winkler', 'Weber', 'Schwarz', 'Maier', 'Alaba', 'Arnautovic', 'Sabitzer', 'Laimer', 'Schlager'],
  },

  // ============================================
  // EUROPE - British Isles
  // ============================================
  SCO: {
    code: 'SCO',
    name: 'Scotland',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    region: 'Europe',
    firstNames: ['James', 'Jack', 'Lewis', 'Oliver', 'Harris', 'Leo', 'Noah', 'Charlie', 'Finlay', 'Logan', 'Alexander', 'Rory', 'Callum', 'Andrew', 'Scott', 'Ryan', 'John', 'Craig', 'Stuart', 'Ross', 'Kieran', 'Billy', 'Kenny', 'Graeme', 'Angus'],
    lastNames: ['Smith', 'Brown', 'Wilson', 'Robertson', 'Campbell', 'Stewart', 'Anderson', 'MacDonald', 'Scott', 'Reid', 'Murray', 'Taylor', 'Clark', 'Ross', 'Young', 'Mitchell', 'Watson', 'Morrison', 'Paterson', 'Fraser', 'McGinn', 'McTominay', 'Tierney', 'McGregor', 'Gilmour'],
  },
  WAL: {
    code: 'WAL',
    name: 'Wales',
    flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    region: 'Europe',
    firstNames: ['Oliver', 'Noah', 'Jack', 'Jacob', 'Leo', 'Harry', 'Oscar', 'George', 'Charlie', 'Theo', 'Dylan', 'Rhys', 'Owen', 'Gareth', 'Aaron', 'Daniel', 'Ethan', 'Ben', 'David', 'Joe', 'Connor', 'Brennan', 'Neco', 'Kieffer', 'Sorba'],
    lastNames: ['Jones', 'Williams', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Hughes', 'Lewis', 'Morgan', 'Griffiths', 'Edwards', 'James', 'Lloyd', 'Owen', 'Price', 'Rees', 'Jenkins', 'Phillips', 'Morris', 'Powell', 'Bale', 'Ramsey', 'Allen', 'Moore', 'Wilson'],
  },
  IRL: {
    code: 'IRL',
    name: 'Ireland',
    flag: '🇮🇪',
    region: 'Europe',
    firstNames: ['Jack', 'James', 'Noah', 'Daniel', 'Conor', 'Liam', 'Luke', 'Sean', 'Adam', 'Harry', 'Michael', 'Cian', 'Fionn', 'Oisin', 'Darragh', 'Patrick', 'Ryan', 'Evan', 'Dylan', 'Charlie', 'Seamus', 'Robbie', 'Shane', 'Matt', 'Callum'],
    lastNames: ['Murphy', 'Kelly', 'O\'Sullivan', 'Walsh', 'Smith', 'O\'Brien', 'Byrne', 'Ryan', 'O\'Connor', 'O\'Neill', 'O\'Reilly', 'Doyle', 'McCarthy', 'Gallagher', 'Doherty', 'Kennedy', 'Lynch', 'Murray', 'Quinn', 'Moore', 'Coleman', 'Doherty', 'Brady', 'Duffy', 'McClean'],
  },
  NIR: {
    code: 'NIR',
    name: 'Northern Ireland',
    flag: '🇬🇧',
    region: 'Europe',
    firstNames: ['James', 'Jack', 'Charlie', 'Oliver', 'Noah', 'Harry', 'Leo', 'Finn', 'Thomas', 'Ethan', 'Jonny', 'Stuart', 'Paddy', 'Niall', 'Craig', 'Steven', 'Corry', 'Jamal', 'Shayne', 'Josh', 'Gavin', 'Kyle', 'Conor', 'Bailey', 'Dion'],
    lastNames: ['Wilson', 'Campbell', 'Stewart', 'Thompson', 'Johnston', 'Martin', 'Moore', 'Brown', 'Graham', 'Hamilton', 'Bell', 'Robinson', 'Walker', 'Wright', 'Hughes', 'Evans', 'Dallas', 'McNair', 'Saville', 'Magennis', 'Washington', 'Peacock-Farrell', 'Ballard', 'Bradley', 'Charles'],
  },

  // ============================================
  // EUROPE - Scandinavia
  // ============================================
  DEN: {
    code: 'DEN',
    name: 'Denmark',
    flag: '🇩🇰',
    region: 'Europe',
    firstNames: ['William', 'Noah', 'Oscar', 'Lucas', 'Oliver', 'Victor', 'Malthe', 'Alfred', 'Carl', 'Emil', 'Christian', 'Kasper', 'Mikkel', 'Simon', 'Andreas', 'Rasmus', 'Jonas', 'Mathias', 'Thomas', 'Pierre-Emile', 'Joakim', 'Joachim', 'Jannik', 'Alexander', 'Yussuf'],
    lastNames: ['Nielsen', 'Jensen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen', 'Larsen', 'Sørensen', 'Rasmussen', 'Petersen', 'Madsen', 'Kristensen', 'Olsen', 'Thomsen', 'Poulsen', 'Møller', 'Eriksen', 'Kjær', 'Schmeichel', 'Højbjerg', 'Dolberg', 'Skov', 'Lindstrøm', 'Damsgaard', 'Braithwaite'],
  },
  SWE: {
    code: 'SWE',
    name: 'Sweden',
    flag: '🇸🇪',
    region: 'Europe',
    firstNames: ['Lucas', 'Liam', 'William', 'Elias', 'Noah', 'Hugo', 'Oliver', 'Oscar', 'Adam', 'Axel', 'Viktor', 'Emil', 'Alexander', 'Sebastian', 'Isak', 'Dejan', 'Zlatan', 'Albin', 'Ludwig', 'Robin', 'Filip', 'Jesper', 'Mattias', 'Marcus', 'Victor'],
    lastNames: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Lindberg', 'Lindqvist', 'Magnusson', 'Forsberg', 'Isak', 'Kulusevski', 'Lindelöf', 'Ekdal', 'Claesson', 'Olsen', 'Augustinsson', 'Krafth', 'Gyökeres'],
  },
  NOR: {
    code: 'NOR',
    name: 'Norway',
    flag: '🇳🇴',
    region: 'Europe',
    firstNames: ['Jakob', 'Emil', 'Noah', 'Oliver', 'Lucas', 'Liam', 'William', 'Isak', 'Oskar', 'Filip', 'Magnus', 'Sander', 'Henrik', 'Martin', 'Erling', 'Mats', 'Stefan', 'Ola', 'Jens', 'Kristoffer', 'Alexander', 'Jonas', 'Andreas', 'Morten', 'John'],
    lastNames: ['Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen', 'Jensen', 'Karlsen', 'Johnsen', 'Pettersen', 'Eriksen', 'Berg', 'Haugen', 'Haaland', 'Ødegaard', 'Sørloth', 'Berge', 'Nyland', 'Ajer', 'Meling', 'Thorsby', 'Elyounoussi', 'King'],
  },
  FIN: {
    code: 'FIN',
    name: 'Finland',
    flag: '🇫🇮',
    region: 'Europe',
    firstNames: ['Leo', 'Elias', 'Eino', 'Väinö', 'Oliver', 'Onni', 'Noel', 'Eetu', 'Veeti', 'Aleksi', 'Jere', 'Joel', 'Teemu', 'Sami', 'Mikael', 'Lassi', 'Robin', 'Fredrik', 'Rasmus', 'Niklas', 'Paulus', 'Urho', 'Glen', 'Pyry', 'Joni'],
    lastNames: ['Korhonen', 'Virtanen', 'Mäkinen', 'Nieminen', 'Mäkelä', 'Hämäläinen', 'Laine', 'Heikkinen', 'Koskinen', 'Järvinen', 'Pukki', 'Kamara', 'Lod', 'Hradecky', 'Arajuuri', 'Toivio', 'Uronen', 'Raitala', 'Pohjanpalo', 'Forss', 'Jensen', 'Schüller', 'Soiri', 'Valakari', 'Sparv'],
  },
  ISL: {
    code: 'ISL',
    name: 'Iceland',
    flag: '🇮🇸',
    region: 'Europe',
    firstNames: ['Aron', 'Alexander', 'Viktor', 'Emil', 'Dagur', 'Jón', 'Birkir', 'Gylfi', 'Kolbeinn', 'Rúnar', 'Hannes', 'Ragnar', 'Kári', 'Albert', 'Arnór', 'Andri', 'Viðar', 'Sveinn', 'Hjörtur', 'Jóhann', 'Ólafur', 'Guðmundur', 'Sigurður', 'Alfreð', 'Hólmar'],
    lastNames: ['Sigurðsson', 'Jónsson', 'Guðmundsson', 'Gunnarsson', 'Ólafsson', 'Kristjánsson', 'Björnsson', 'Magnússon', 'Þórsson', 'Árnason', 'Halldórsson', 'Finnbogason', 'Bjarnason', 'Sævarsson', 'Ingason', 'Hermannsson', 'Traustason', 'Baldursson', 'Thorsteinsson', 'Pálsson', 'Guðjohnsen', 'Sigþórsson', 'Böðvarsson', 'Skúlason', 'Friðjónsson'],
  },

  // ============================================
  // EUROPE - Eastern
  // ============================================
  POL: {
    code: 'POL',
    name: 'Poland',
    flag: '🇵🇱',
    region: 'Europe',
    firstNames: ['Antoni', 'Jakub', 'Jan', 'Szymon', 'Filip', 'Aleksander', 'Franciszek', 'Mikołaj', 'Wojciech', 'Kacper', 'Adam', 'Piotr', 'Robert', 'Kamil', 'Arkadiusz', 'Grzegorz', 'Przemysław', 'Krzysztof', 'Bartosz', 'Mateusz', 'Sebastian', 'Łukasz', 'Dawid', 'Paweł', 'Maciej'],
    lastNames: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur', 'Kwiatkowski', 'Wojciechowski', 'Krawczyk', 'Piotrowski', 'Grabowski', 'Pawłowski', 'Michalski', 'Król', 'Wieczorek', 'Jabłoński', 'Nowakowski'],
  },
  CRO: {
    code: 'CRO',
    name: 'Croatia',
    flag: '🇭🇷',
    region: 'Europe',
    firstNames: ['Luka', 'Ivan', 'Mateo', 'Josip', 'Marko', 'Nikola', 'Ante', 'Duje', 'Bruno', 'Lovro', 'Mario', 'Andrej', 'Domagoj', 'Šime', 'Dejan', 'Marcelo', 'Joško', 'Borna', 'Mislav', 'Kristijan', 'Martin', 'Filip', 'Dominik', 'Antonio', 'Petar'],
    lastNames: ['Horvat', 'Kovačević', 'Babić', 'Marić', 'Jurić', 'Novak', 'Kovač', 'Knežević', 'Vuković', 'Marković', 'Perić', 'Matić', 'Tomić', 'Pavlović', 'Božić', 'Modrić', 'Perišić', 'Rebić', 'Brozović', 'Gvardiol', 'Kramarić', 'Kovačić', 'Lovren', 'Vlašić', 'Livaković'],
  },
  SRB: {
    code: 'SRB',
    name: 'Serbia',
    flag: '🇷🇸',
    region: 'Europe',
    firstNames: ['Luka', 'Nikola', 'Stefan', 'Marko', 'Aleksandar', 'Nemanja', 'Dušan', 'Filip', 'Miloš', 'Vanja', 'Predrag', 'Dejan', 'Branislav', 'Sergej', 'Andrija', 'Mijat', 'Darko', 'Saša', 'Ivan', 'Uroš', 'Lazar', 'Petar', 'Vladimir', 'Veljko', 'Strahinja'],
    lastNames: ['Jovanović', 'Petrović', 'Nikolić', 'Marković', 'Đorđević', 'Stojanović', 'Ilić', 'Stanković', 'Pavlović', 'Milošević', 'Tadić', 'Vlahović', 'Mitrović', 'Kostić', 'Milinković-Savić', 'Živković', 'Lukić', 'Pavković', 'Ristić', 'Radonjić', 'Gudelj', 'Rajković', 'Vidić', 'Matić', 'Ivanović'],
  },
  UKR: {
    code: 'UKR',
    name: 'Ukraine',
    flag: '🇺🇦',
    region: 'Europe',
    firstNames: ['Oleksandr', 'Andriy', 'Mykola', 'Viktor', 'Taras', 'Roman', 'Yevhen', 'Vitaliy', 'Ruslan', 'Denys', 'Serhiy', 'Artem', 'Bohdan', 'Dmytro', 'Eduard', 'Illya', 'Georgiy', 'Mykhailo', 'Oleksiy', 'Vladyslav', 'Anatoliy', 'Heorhiy', 'Maksym', 'Yaroslav', 'Pavlo'],
    lastNames: ['Shevchenko', 'Kovalenko', 'Bondarenko', 'Tkachenko', 'Kravchenko', 'Oliynyk', 'Shevchuk', 'Kovalchuk', 'Polishchuk', 'Boyko', 'Zinchenko', 'Mudryk', 'Malinovskyi', 'Yarmolenko', 'Mykolenko', 'Tsygankov', 'Dovbyk', 'Zabarnyi', 'Sydorchuk', 'Matviyenko', 'Lunin', 'Trubin', 'Shaparenko', 'Stepanenko', 'Yaremchuk'],
  },
  RUS: {
    code: 'RUS',
    name: 'Russia',
    flag: '🇷🇺',
    region: 'Europe',
    firstNames: ['Alexander', 'Dmitri', 'Maxim', 'Artem', 'Ivan', 'Mikhail', 'Andrei', 'Sergei', 'Nikita', 'Denis', 'Roman', 'Alexei', 'Yuri', 'Igor', 'Konstantin', 'Fedor', 'Anton', 'Vyacheslav', 'Vladimir', 'Daniil', 'Pavel', 'Viktor', 'Georgi', 'Kirill', 'Stanislav'],
    lastNames: ['Ivanov', 'Smirnov', 'Kuznetsov', 'Popov', 'Vasiliev', 'Petrov', 'Sokolov', 'Mikhailov', 'Novikov', 'Fedorov', 'Morozov', 'Volkov', 'Alekseev', 'Lebedev', 'Semenov', 'Golovin', 'Miranchuk', 'Dzyuba', 'Cheryshev', 'Zhirkov', 'Zobnin', 'Fernandes', 'Smolov', 'Lunev', 'Guilherme'],
  },
  CZE: {
    code: 'CZE',
    name: 'Czech Republic',
    flag: '🇨🇿',
    region: 'Europe',
    firstNames: ['Jakub', 'Jan', 'Tomáš', 'Adam', 'Matěj', 'Filip', 'Vojtěch', 'Lukáš', 'Ondřej', 'David', 'Daniel', 'Patrik', 'Vladimír', 'Pavel', 'Petr', 'Michal', 'Martin', 'Antonín', 'Václav', 'Ladislav', 'Alex', 'Mojmír', 'Theodor', 'Aleš', 'Radek'],
    lastNames: ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Schick', 'Souček', 'Coufal', 'Hložek', 'Barák', 'Jankto', 'Krejčí', 'Vydra', 'Darida', 'Masopust', 'Král', 'Zima', 'Staněk', 'Vacek', 'Provod'],
  },
  SVK: {
    code: 'SVK',
    name: 'Slovakia',
    flag: '🇸🇰',
    region: 'Europe',
    firstNames: ['Jakub', 'Adam', 'Šimon', 'Martin', 'Tomáš', 'Lukáš', 'Filip', 'Matúš', 'Samuel', 'Michal', 'Peter', 'Marek', 'Milan', 'Róbert', 'Juraj', 'Ondrej', 'Stanislav', 'Dávid', 'Vladimír', 'Norbert', 'Patrik', 'Ivan', 'Ján', 'Pavol', 'Denis'],
    lastNames: ['Horváth', 'Kováč', 'Varga', 'Tóth', 'Nagy', 'Baláž', 'Szabó', 'Molnár', 'Lukáč', 'Oravec', 'Hamšík', 'Škriniar', 'Lobotka', 'Dúbravka', 'Kucka', 'Mak', 'Hancko', 'Pekarík', 'Vavro', 'Suslov', 'Haraslín', 'Schranz', 'Gyömbér', 'Koscelník', 'Boženík'],
  },
  HUN: {
    code: 'HUN',
    name: 'Hungary',
    flag: '🇭🇺',
    region: 'Europe',
    firstNames: ['Bence', 'Máté', 'Levente', 'Dávid', 'Ádám', 'Dániel', 'Balázs', 'Dominik', 'Péter', 'Zsolt', 'László', 'Attila', 'Roland', 'Tamás', 'Gergő', 'Barnabás', 'Krisztián', 'Zoltán', 'András', 'Norbert', 'Willi', 'Loïc', 'Callum', 'Kevin', 'Martin'],
    lastNames: ['Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas', 'Szalai', 'Gulácsi', 'Orbán', 'Szoboszlai', 'Sallai', 'Kleinheisler', 'Fiola', 'Kerkez', 'Schäfer', 'Nego', 'Dibusz', 'Lang', 'Botka', 'Styles', 'Csoboth'],
  },
  ROU: {
    code: 'ROU',
    name: 'Romania',
    flag: '🇷🇴',
    region: 'Europe',
    firstNames: ['Andrei', 'Alexandru', 'David', 'Gabriel', 'Mihai', 'Stefan', 'Ionuț', 'Florin', 'Cosmin', 'Adrian', 'Bogdan', 'Cristian', 'Radu', 'Nicolae', 'Valentin', 'Denis', 'Ianis', 'Răzvan', 'Florinel', 'George', 'Vlad', 'Darius', 'Nicușor', 'Marius', 'Claudiu'],
    lastNames: ['Popa', 'Popescu', 'Ionescu', 'Stan', 'Dumitru', 'Stoica', 'Gheorghe', 'Rusu', 'Munteanu', 'Matei', 'Hagi', 'Stanciu', 'Mihăilă', 'Drăgușin', 'Rațiu', 'Man', 'Coman', 'Marin', 'Niță', 'Burcă', 'Bancu', 'Sorescu', 'Cicâldău', 'Olaru', 'Tănase'],
  },
  GRE: {
    code: 'GRE',
    name: 'Greece',
    flag: '🇬🇷',
    region: 'Europe',
    firstNames: ['Georgios', 'Dimitrios', 'Konstantinos', 'Ioannis', 'Nikolaos', 'Panagiotis', 'Christos', 'Athanasios', 'Vasileios', 'Michail', 'Alexandros', 'Evangelos', 'Kostas', 'Sokratis', 'Giannis', 'Anastasios', 'Fotis', 'Manolis', 'Dimitris', 'Petros', 'Lazaros', 'Tasos', 'Vangelis', 'Thanasis', 'Efthymios'],
    lastNames: ['Papadopoulos', 'Papadakis', 'Papanikolaou', 'Georgiou', 'Nikolaou', 'Konstantinidis', 'Dimitriou', 'Oikonomou', 'Vasileiou', 'Alexiou', 'Mavropanos', 'Tzolis', 'Masouras', 'Bakasetas', 'Pavlidis', 'Fortounis', 'Mantalos', 'Vlachodimos', 'Giannoulis', 'Tsimikas', 'Siovas', 'Limnios', 'Pelkas', 'Douvikas', 'Ioannidis'],
  },
  TUR: {
    code: 'TUR',
    name: 'Turkey',
    flag: '🇹🇷',
    region: 'Europe',
    firstNames: ['Yusuf', 'Eyüp', 'Ömer', 'Mustafa', 'Emir', 'Kerem', 'Arda', 'Hakan', 'Cengiz', 'Burak', 'Cenk', 'Ozan', 'Çağlar', 'Mert', 'Okay', 'Dorukhan', 'Irfan', 'Umut', 'Enes', 'Kaan', 'Salih', 'Zeki', 'Berkan', 'Barış', 'Orkun'],
    lastNames: ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Aktürkoğlu', 'Çalhanoğlu', 'Söyüncü', 'Ünder', 'Tosun', 'Günok', 'Kabak', 'Yazıcı', 'Kökcü', 'Demiral', 'Karaman', 'Kutlu', 'Özcan', 'Müldür', 'Bardakcı'],
  },

  // ============================================
  // SOUTH AMERICA
  // ============================================
  BRA: {
    code: 'BRA',
    name: 'Brazil',
    flag: '🇧🇷',
    region: 'South America',
    firstNames: ['Lucas', 'Gabriel', 'Matheus', 'Felipe', 'Rafael', 'Guilherme', 'Pedro', 'Bruno', 'Leonardo', 'Vinícius', 'Neymar', 'Thiago', 'Casemiro', 'Marquinhos', 'Richarlison', 'Rodrygo', 'Raphinha', 'Fabinho', 'Alisson', 'Ederson', 'Antony', 'Endrick', 'Éder', 'Danilo', 'Alex'],
    lastNames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Ferreira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Araújo', 'Ribeiro', 'Gomes', 'Martins', 'Carvalho', 'Rocha', 'Vieira', 'Barbosa', 'Moura', 'Paquetá', 'Militão', 'Bremer', 'Martinelli', 'Firmino'],
  },
  ARG: {
    code: 'ARG',
    name: 'Argentina',
    flag: '🇦🇷',
    region: 'South America',
    firstNames: ['Lionel', 'Ángel', 'Paulo', 'Gonzalo', 'Sergio', 'Nicolás', 'Rodrigo', 'Leandro', 'Emiliano', 'Julián', 'Lautaro', 'Alejandro', 'Enzo', 'Alexis', 'Cristian', 'Marcos', 'Lisandro', 'Nahuel', 'Germán', 'Guido', 'Exequiel', 'Giovanni', 'Thiago', 'Valentín', 'Matías'],
    lastNames: ['González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'García', 'Pérez', 'Sánchez', 'Romero', 'Díaz', 'Messi', 'Di María', 'Dybala', 'Álvarez', 'Paredes', 'De Paul', 'Mac Allister', 'Otamendi', 'Tagliafico', 'Molina', 'Rulli', 'Palacios', 'Garnacho', 'Correa', 'Acuña'],
  },
  COL: {
    code: 'COL',
    name: 'Colombia',
    flag: '🇨🇴',
    region: 'South America',
    firstNames: ['Juan', 'Santiago', 'Sebastián', 'Samuel', 'Mateo', 'Nicolás', 'Daniel', 'Andrés', 'David', 'Luis', 'James', 'Radamel', 'Yerry', 'Davinson', 'Jhon', 'Jefferson', 'Wilmar', 'Mateus', 'Jorge', 'Rafael', 'Duván', 'Miguel', 'Carlos', 'Camilo', 'Kevin'],
    lastNames: ['Rodríguez', 'García', 'Martínez', 'López', 'González', 'Hernández', 'Sánchez', 'Pérez', 'Gómez', 'Díaz', 'Cuadrado', 'Falcao', 'Mina', 'Sánchez', 'Arias', 'Lerma', 'Barrios', 'Uribe', 'Zapata', 'Borré', 'Muriel', 'Mojica', 'Ospina', 'Vargas', 'Sinisterra'],
  },
  URU: {
    code: 'URU',
    name: 'Uruguay',
    flag: '🇺🇾',
    region: 'South America',
    firstNames: ['Juan', 'Matías', 'Santiago', 'Nicolás', 'Luis', 'Diego', 'Federico', 'Rodrigo', 'Martín', 'José', 'Edinson', 'Darwin', 'Ronald', 'Sebastián', 'Giorgian', 'Manuel', 'Maxi', 'Facundo', 'Mathías', 'Agustín', 'Fernando', 'Gastón', 'Nahitan', 'Lucas', 'Guillermo'],
    lastNames: ['González', 'Rodríguez', 'Martínez', 'García', 'Fernández', 'López', 'Pérez', 'Suárez', 'Silva', 'Díaz', 'Cavani', 'Núñez', 'Araujo', 'Valverde', 'Bentancur', 'De Arrascaeta', 'Godín', 'Giménez', 'Coates', 'Muslera', 'Cáceres', 'Torreira', 'Vecino', 'Pellistri', 'Ugarte'],
  },
  CHI: {
    code: 'CHI',
    name: 'Chile',
    flag: '🇨🇱',
    region: 'South America',
    firstNames: ['Benjamín', 'Martín', 'Matías', 'Joaquín', 'Agustín', 'Lucas', 'Vicente', 'Tomás', 'Sebastián', 'Felipe', 'Alexis', 'Arturo', 'Charles', 'Eduardo', 'Gary', 'Erick', 'Guillermo', 'Mauricio', 'Claudio', 'Marcelo', 'Ben', 'Marcelino', 'Diego', 'Víctor', 'Pablo'],
    lastNames: ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda', 'Sánchez', 'Vidal', 'Aránguiz', 'Vargas', 'Medel', 'Bravo', 'Isla', 'Maripán', 'Brereton', 'Palacios', 'Núñez', 'Dávila', 'Osorio', 'Tapia', 'Galdames'],
  },
  ECU: {
    code: 'ECU',
    name: 'Ecuador',
    flag: '🇪🇨',
    region: 'South America',
    firstNames: ['Mateo', 'Santiago', 'Sebastián', 'Emiliano', 'Martín', 'Lucas', 'Dylan', 'Iker', 'Thiago', 'Samuel', 'Moisés', 'Pervis', 'Gonzalo', 'Enner', 'Angelo', 'Jeremy', 'Michael', 'Byron', 'Piero', 'Carlos', 'Robert', 'Jefferson', 'Jhegson', 'Alan', 'Kevin'],
    lastNames: ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Caicedo', 'Estupiñán', 'Plata', 'Valencia', 'Preciado', 'Hincapié', 'Cifuentes', 'Méndez', 'Arboleda', 'Galíndez', 'Franco', 'Estrada', 'Reasco', 'Páez', 'Sarmiento'],
  },
  PER: {
    code: 'PER',
    name: 'Peru',
    flag: '🇵🇪',
    region: 'South America',
    firstNames: ['Mateo', 'Santiago', 'Sebastián', 'Leonardo', 'Thiago', 'Rodrigo', 'Diego', 'Nicolás', 'Joaquín', 'Lucas', 'Paolo', 'Christian', 'Gianluca', 'André', 'Edison', 'Pedro', 'Luis', 'Renato', 'Yoshimar', 'Carlos', 'Bryan', 'Raziel', 'Marcos', 'Alex', 'Miguel'],
    lastNames: ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Fernández', 'Sánchez', 'Chávez', 'Flores', 'Díaz', 'Guerrero', 'Cueva', 'Carrillo', 'Lapadula', 'Zambrano', 'Tapia', 'Advíncula', 'Yotún', 'Gallese', 'Aquino', 'Peña', 'Santamaría', 'Abram', 'Trauco', 'López'],
  },
  PAR: {
    code: 'PAR',
    name: 'Paraguay',
    flag: '🇵🇾',
    region: 'South America',
    firstNames: ['Mateo', 'Santiago', 'Benjamín', 'Thiago', 'Lucas', 'Sebastián', 'Dylan', 'Nicolás', 'Juan', 'Óscar', 'Miguel', 'Antonio', 'Gustavo', 'Celso', 'Derlis', 'Gastón', 'Ángel', 'Richard', 'Omar', 'Robert', 'Fabián', 'Julio', 'Hernán', 'Mathías', 'Alejandro'],
    lastNames: ['González', 'Rodríguez', 'Martínez', 'López', 'García', 'Fernández', 'Benítez', 'Romero', 'Villalba', 'Giménez', 'Almirón', 'Sanabria', 'Gómez', 'Enciso', 'Arzamendia', 'Alderete', 'Balbuena', 'Piris', 'Cardozo', 'Silva', 'Bobadilla', 'Samudio', 'Espínola', 'Rojas', 'Cubas'],
  },
  VEN: {
    code: 'VEN',
    name: 'Venezuela',
    flag: '🇻🇪',
    region: 'South America',
    firstNames: ['Sebastián', 'Samuel', 'Santiago', 'Mateo', 'Daniel', 'Gabriel', 'Diego', 'Alejandro', 'Andrés', 'David', 'Salomón', 'Yeferson', 'José', 'Darwin', 'Jhon', 'Wuilker', 'Tomás', 'Jefferson', 'Yordan', 'Eduard', 'Jan', 'Miguel', 'Cristian', 'Rommel', 'Yangel'],
    lastNames: ['Rodríguez', 'González', 'García', 'Martínez', 'Hernández', 'López', 'Pérez', 'Díaz', 'Sánchez', 'Ramírez', 'Rondón', 'Soteldo', 'Machís', 'Rincón', 'Fariñez', 'Osorio', 'Ferraresi', 'Chancellor', 'Herrera', 'Savarino', 'Cásseres', 'Martínez', 'Murillo', 'Segovia', 'Bello'],
  },
  BOL: {
    code: 'BOL',
    name: 'Bolivia',
    flag: '🇧🇴',
    region: 'South America',
    firstNames: ['Mateo', 'Santiago', 'Sebastián', 'Lucas', 'Benjamín', 'Daniel', 'Gabriel', 'Marcelo', 'Juan', 'Diego', 'Henry', 'Ramiro', 'Boris', 'Carlos', 'Leonel', 'Antonio', 'Franz', 'Víctor', 'José', 'Rodrigo', 'Erwin', 'Roberto', 'Fernando', 'Miguel', 'Jesús'],
    lastNames: ['Mamani', 'Quispe', 'Condori', 'Flores', 'García', 'Choque', 'Gonzales', 'Rodríguez', 'Morales', 'Vargas', 'Martins', 'Vaca', 'Justiniano', 'Saavedra', 'Cuellar', 'Arce', 'Fernández', 'Ramallo', 'Villarroel', 'Graneda', 'Terceros', 'Algarañaz', 'Miranda', 'Lampe', 'Viscarra'],
  },

  // ============================================
  // AFRICA
  // ============================================
  MAR: {
    code: 'MAR',
    name: 'Morocco',
    flag: '🇲🇦',
    region: 'Africa',
    firstNames: ['Youssef', 'Adam', 'Mohamed', 'Ayoub', 'Yassine', 'Anas', 'Hamza', 'Achraf', 'Sofiane', 'Nayef', 'Hakim', 'Noussair', 'Romain', 'Azzedine', 'Ilias', 'Abderrazak', 'Selim', 'Brahim', 'Jawad', 'Zakaria', 'Sofyan', 'Bilal', 'Munir', 'Walid', 'Faycal'],
    lastNames: ['El Amrani', 'Bennani', 'Idrissi', 'Alaoui', 'Tazi', 'Berrada', 'Fassi', 'El Ouazzani', 'Chaoui', 'Ziyech', 'Hakimi', 'Mazraoui', 'Boufal', 'Amrabat', 'Ounahi', 'En-Nesyri', 'Aguerd', 'Saiss', 'Bounou', 'El Kaabi', 'Diaz', 'Ezzalzouli', 'Chair', 'Cheddira', 'Hadj Moussa'],
  },
  SEN: {
    code: 'SEN',
    name: 'Senegal',
    flag: '🇸🇳',
    region: 'Africa',
    firstNames: ['Mamadou', 'Moussa', 'Cheikh', 'Ibrahima', 'Abdoulaye', 'Sadio', 'Kalidou', 'Idrissa', 'Pape', 'Boulaye', 'Ismaïla', 'Edouard', 'Krépin', 'Famara', 'Nampalys', 'Fodé', 'Iliman', 'Pathé', 'Habib', 'Nicolas', 'Saliou', 'Youssouf', 'Lamine', 'Aliou', 'Demba'],
    lastNames: ['Diallo', 'Diop', 'Ndiaye', 'Fall', 'Sow', 'Sarr', 'Gueye', 'Ba', 'Mbaye', 'Cissé', 'Mané', 'Koulibaly', 'Mendy', 'Kouyaté', 'Diouf', 'Baldé', 'Diatta', 'Jakobs', 'Dia', 'Seck', 'Gomis', 'Sabaly', 'Pape', 'Ndao', 'Camara'],
  },
  NGA: {
    code: 'NGA',
    name: 'Nigeria',
    flag: '🇳🇬',
    region: 'Africa',
    firstNames: ['Chukwuemeka', 'Oluwaseun', 'Adebayo', 'Emeka', 'Chidera', 'Victor', 'Samuel', 'Kelechi', 'Wilfred', 'Alex', 'Ahmed', 'Ola', 'William', 'Joe', 'Calvin', 'Moses', 'Taiwo', 'Leon', 'Frank', 'Kenneth', 'Emmanuel', 'Cyriel', 'Bright', 'Zaidu', 'Terem'],
    lastNames: ['Okonkwo', 'Adeyemi', 'Okoro', 'Nwankwo', 'Eze', 'Uche', 'Chukwu', 'Okafor', 'Ibrahim', 'Mohammed', 'Osimhen', 'Iheanacho', 'Ndidi', 'Lookman', 'Awoniyi', 'Onyeka', 'Bassey', 'Aribo', 'Iwobi', 'Simon', 'Chukwueze', 'Aina', 'Ekong', 'Sanusi', 'Moffi'],
  },
  CIV: {
    code: 'CIV',
    name: 'Ivory Coast',
    flag: '🇨🇮',
    region: 'Africa',
    firstNames: ['Serge', 'Nicolas', 'Franck', 'Wilfried', 'Simon', 'Jean-Philippe', 'Maxwel', 'Ibrahim', 'Sébastien', 'Odilon', 'Yves', 'Christian', 'Jeremie', 'Max-Alain', 'Evan', 'Karim', 'Trevoh', 'Oumar', 'Seko', 'Willy', 'Ghislain', 'Emmanuel', 'Ange', 'Cheick', 'Hassane'],
    lastNames: ['Aurier', 'Pépé', 'Kessié', 'Zaha', 'Adingra', 'Gbamin', 'Cornet', 'Sangaré', 'Haller', 'Koné', 'Deli', 'Boli', 'Gradel', 'Diomandé', 'Bamba', 'Fofana', 'Chalobah', 'Diakité', 'Coulibaly', 'Touré', 'Konan', 'N\'Dri', 'Tiehi', 'Kamara', 'Bayo'],
  },
  ALG: {
    code: 'ALG',
    name: 'Algeria',
    flag: '🇩🇿',
    region: 'Africa',
    firstNames: ['Riyad', 'Islam', 'Ismael', 'Said', 'Youcef', 'Ramy', 'Hicham', 'Amir', 'Amine', 'Adam', 'Sofiane', 'Houssem', 'Yacine', 'Baghdad', 'Djamel', 'Mehdi', 'Adlène', 'Raïs', 'Fares', 'Ilyes', 'Nabil', 'Abdelkader', 'Ramiz', 'Aissa', 'Farès'],
    lastNames: ['Mahrez', 'Slimani', 'Bennacer', 'Atal', 'Belaili', 'Brahimi', 'Boudaoui', 'Benrahma', 'Zerrouki', 'Aouar', 'Feghouli', 'Guedioura', 'Mandi', 'M\'Bolhi', 'Bensebaini', 'Mandréa', 'Zorgane', 'Belkebla', 'Boulaya', 'Bedrane', 'Touba', 'Tougai', 'Charef', 'Lemina', 'Bentaleb'],
  },
  EGY: {
    code: 'EGY',
    name: 'Egypt',
    flag: '🇪🇬',
    region: 'Africa',
    firstNames: ['Mohamed', 'Ahmed', 'Omar', 'Youssef', 'Adam', 'Ali', 'Mahmoud', 'Mostafa', 'Karim', 'Ziad', 'Trézéguet', 'Marwan', 'Amr', 'Ibrahim', 'Emam', 'Hamdi', 'Ayman', 'Akram', 'Tarek', 'Nabil', 'Ramadan', 'Fathi', 'Hossam', 'Trezeguet', 'Zizo'],
    lastNames: ['Salah', 'El-Nenny', 'Hegazy', 'Trezeguet', 'Sobhi', 'Ashour', 'Fathy', 'Mohsen', 'El-Shenawy', 'Kamal', 'Hassan', 'Elneny', 'Warda', 'Marmoush', 'Mostafa', 'Kouka', 'Hamdy', 'Attia', 'Gabr', 'Said', 'Abo-Gabal', 'Farouk', 'Emam', 'Samy', 'Adel'],
  },
  CMR: {
    code: 'CMR',
    name: 'Cameroon',
    flag: '🇨🇲',
    region: 'Africa',
    firstNames: ['Samuel', 'Eric', 'Vincent', 'Andre', 'Jean-Pierre', 'Karl', 'Bryan', 'Collins', 'Martin', 'Pierre', 'Nicolas', 'Olivier', 'Christian', 'Michael', 'Jean', 'Georges', 'Moumi', 'Arnaud', 'Frank', 'Ignatius', 'Kevin', 'Jerome', 'Harold', 'Enzo', 'James'],
    lastNames: ['Eto\'o', 'Aboubakar', 'Choupo-Moting', 'Onana', 'Toko Ekambi', 'Anguissa', 'Mbeumo', 'Fai', 'Castelletto', 'Ngamaleu', 'Hongla', 'Kunde', 'Bassogog', 'Nkoulou', 'Njie', 'Ganago', 'Marou', 'Moukoudi', 'N\'Koudou', 'Mbarga', 'Ondoua', 'Tchamba', 'Mbekeli', 'Song', 'Epassy'],
  },
  GHA: {
    code: 'GHA',
    name: 'Ghana',
    flag: '🇬🇭',
    region: 'Africa',
    firstNames: ['Thomas', 'Jordan', 'Mohammed', 'Daniel', 'Andre', 'Alexander', 'Inaki', 'Tariq', 'Antoine', 'Abdul', 'Jeffrey', 'Kamaldeen', 'Elisha', 'Lawrence', 'Joseph', 'Baba', 'Alidu', 'Gideon', 'Dennis', 'Jonathan', 'Edmund', 'Osman', 'Salis', 'Ibrahim', 'Felix'],
    lastNames: ['Partey', 'Ayew', 'Kudus', 'Amartey', 'Djiku', 'Williams', 'Lamptey', 'Semenyo', 'Sulemana', 'Owusu', 'Schlupp', 'Ati-Zigi', 'Afena-Gyan', 'Kyereh', 'Mensah', 'Abdul Rahman', 'Seidu', 'Addo', 'Boateng', 'Paintsil', 'Wakaso', 'Nuhu', 'Bukari', 'Mohammed', 'Opoku'],
  },
  TUN: {
    code: 'TUN',
    name: 'Tunisia',
    flag: '🇹🇳',
    region: 'Africa',
    firstNames: ['Youssef', 'Mohamed', 'Anis', 'Wahbi', 'Ellyes', 'Hannibal', 'Dylan', 'Naïm', 'Ali', 'Montassar', 'Ferjani', 'Saifeddine', 'Ghaylen', 'Issam', 'Aymen', 'Hamza', 'Seifeddine', 'Omar', 'Bilel', 'Wajdi', 'Mohamed Ali', 'Fakhreddine', 'Mortadha', 'Rami', 'Moez'],
    lastNames: ['Msakni', 'Khazri', 'Skhiri', 'Slimane', 'Bronn', 'Mejbri', 'Jaziri', 'Sliti', 'Ben Romdhane', 'Sassi', 'Talbi', 'Laidouni', 'Dahmen', 'Kechrida', 'Drager', 'Maaloul', 'Mathlouthi', 'Haddadi', 'Ben Slimane', 'Jebali', 'Ghandri', 'Abdi', 'Rekik', 'Akaichi', 'Ben Hmida'],
  },
  MLI: {
    code: 'MLI',
    name: 'Mali',
    flag: '🇲🇱',
    region: 'Africa',
    firstNames: ['Amadou', 'Moussa', 'Yves', 'Hamari', 'Massadio', 'Boubacar', 'Mohamed', 'Ibrahima', 'Kamory', 'Sékou', 'Lassana', 'Adama', 'Abdoulaye', 'Cheick', 'Aliou', 'Mamadou', 'Diadie', 'El Bilal', 'Fodé', 'Falaye', 'Issiaka', 'Makan', 'Kalifa', 'Nene', 'Sambou'],
    lastNames: ['Haidara', 'Maïga', 'Bissouma', 'Traoré', 'Koné', 'Camara', 'Touré', 'Diallo', 'Coulibaly', 'Kouyaté', 'Djenepo', 'Samassékou', 'Sissoko', 'Doumbia', 'Diawara', 'Sacko', 'Dembélé', 'Cissé', 'Sidibé', 'Keita', 'Fofana', 'Sanogo', 'Bagayoko', 'Mounkoro', 'Yatabaré'],
  },
  COD: {
    code: 'COD',
    name: 'DR Congo',
    flag: '🇨🇩',
    region: 'Africa',
    firstNames: ['Yannick', 'Chancel', 'Cédric', 'Dieumerci', 'Mulumba', 'Joris', 'Théo', 'Gaël', 'Samuel', 'Arthur', 'Silas', 'Nathan', 'Fiston', 'Chadrack', 'Jackson', 'Meschack', 'Edo', 'Christian', 'Gabriel', 'Glody', 'Amon', 'Vital', 'Joel', 'Neeskens', 'Ngonda'],
    lastNames: ['Bolasie', 'Mbemba', 'Bakambu', 'Mbokani', 'Kakuta', 'Kayembe', 'Bope', 'Kakuta', 'Wissa', 'Masuaku', 'Mpoku', 'Akpala', 'Assombalonga', 'Mayele', 'Luyindama', 'Tisserand', 'Kebano', 'Ngcongca', 'Diallo', 'Masasi', 'Mokonzi', 'Kabongo', 'Elia', 'Kebano', 'Moke'],
  },
  ZAF: {
    code: 'ZAF',
    name: 'South Africa',
    flag: '🇿🇦',
    region: 'Africa',
    firstNames: ['Percy', 'Bongani', 'Themba', 'Lebo', 'Keagan', 'Dean', 'Luke', 'Darren', 'Bradley', 'Thibang', 'Ronwen', 'Teboho', 'Evidence', 'Siyanda', 'Grant', 'Hugo', 'Thapelo', 'Sfiso', 'Ethan', 'Lyle', 'Aubrey', 'Thulani', 'Khama', 'Luther', 'Reeve'],
    lastNames: ['Tau', 'Zungu', 'Zwane', 'Mothiba', 'Dolly', 'Furman', 'Fleurs', 'Kekana', 'Grobler', 'Mokoena', 'Williams', 'Ngezana', 'Makgopa', 'Xulu', 'Modiba', 'Lepasa', 'Hlongwane', 'Gordinho', 'Mvala', 'Lakay', 'Brooks', 'Singh', 'Billiat', 'Foster', 'Frosler'],
  },

  // ============================================
  // ASIA
  // ============================================
  JPN: {
    code: 'JPN',
    name: 'Japan',
    flag: '🇯🇵',
    region: 'Asia',
    firstNames: ['Takumi', 'Kaoru', 'Daichi', 'Takehiro', 'Yuki', 'Keisuke', 'Shinji', 'Hiroki', 'Maya', 'Gaku', 'Ritsu', 'Wataru', 'Junya', 'Ko', 'Ayase', 'Hidemasa', 'Shuichi', 'Yuya', 'Takefusa', 'Ao', 'Mao', 'Keito', 'Koki', 'Shuto', 'Yuta'],
    lastNames: ['Minamino', 'Mitoma', 'Kamada', 'Tomiyasu', 'Soma', 'Honda', 'Kagawa', 'Sakai', 'Yoshida', 'Shibasaki', 'Doan', 'Endo', 'Ito', 'Itakura', 'Ueda', 'Morita', 'Gonda', 'Tanaka', 'Kubo', 'Machino', 'Maeda', 'Hosoya', 'Nakamura', 'Suzuki', 'Inoue'],
  },
  KOR: {
    code: 'KOR',
    name: 'South Korea',
    flag: '🇰🇷',
    region: 'Asia',
    firstNames: ['Heung-min', 'Min-jae', 'Woo-yeong', 'Hwang', 'Jae-sung', 'Sang-ho', 'Jin-su', 'Seung-ho', 'In-beom', 'Gue-sung', 'Hee-chan', 'Chang-hoon', 'Tae-hwan', 'Yong-woo', 'Dong-jin', 'Young-gwon', 'Seung-woo', 'Kang-in', 'Ji-sung', 'Moon-hwan', 'Kyung-won', 'Jun-ho', 'Hyun-soo', 'Ui-jo', 'Min-hyeok'],
    lastNames: ['Son', 'Kim', 'Lee', 'Park', 'Hwang', 'Jung', 'Cho', 'Jeong', 'Kwon', 'Hong', 'Na', 'Seol', 'Koo', 'Oh', 'Yang', 'Yoon', 'Jang', 'Paik', 'Go', 'Bae', 'Han', 'Moon', 'Choi', 'Baek', 'Ryu'],
  },
  IRN: {
    code: 'IRN',
    name: 'Iran',
    flag: '🇮🇷',
    region: 'Asia',
    firstNames: ['Alireza', 'Mehdi', 'Sardar', 'Karim', 'Morteza', 'Saman', 'Ehsan', 'Ali', 'Omid', 'Ramin', 'Ahmad', 'Milad', 'Saeid', 'Vahid', 'Allahyar', 'Shoja', 'Ashkan', 'Hossein', 'Mohammad', 'Reza', 'Amir', 'Siavash', 'Kaveh', 'Majid', 'Sadegh'],
    lastNames: ['Jahanbakhsh', 'Taremi', 'Azmoun', 'Ansarifard', 'Pouraliganji', 'Ghoddos', 'Hajsafi', 'Karimi', 'Daei', 'Rezaeian', 'Mohammadi', 'Hosseini', 'Ebrahimi', 'Amiri', 'Sayyadmanesh', 'Khalilzadeh', 'Dejagah', 'Nourollahi', 'Beiranvand', 'Abedzadeh', 'Niazmand', 'Gholizadeh', 'Torabi', 'Ezatolahi', 'Moharrami'],
  },
  AUS: {
    code: 'AUS',
    name: 'Australia',
    flag: '🇦🇺',
    region: 'Asia',
    firstNames: ['Oliver', 'William', 'Jack', 'Noah', 'Leo', 'Harry', 'Charlie', 'Thomas', 'James', 'Henry', 'Aaron', 'Mathew', 'Mitchell', 'Ajdin', 'Jackson', 'Riley', 'Kye', 'Keanu', 'Cameron', 'Bailey', 'Awer', 'Martin', 'Nathaniel', 'Craig', 'Aziz'],
    lastNames: ['Mooy', 'Ryan', 'Leckie', 'Duke', 'Irvine', 'Rogic', 'Hrustic', 'Behich', 'McGree', 'Souttar', 'Mabil', 'Boyle', 'Maclaren', 'Kuol', 'Wright', 'Atkinson', 'King', 'Deng', 'Rowles', 'Goodwin', 'Devlin', 'Tilio', 'Metcalfe', 'Baccus', 'Circati'],
  },
  SAU: {
    code: 'SAU',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    region: 'Asia',
    firstNames: ['Salem', 'Saleh', 'Mohammed', 'Firas', 'Yasser', 'Saud', 'Nawaf', 'Abdullah', 'Abdulrahman', 'Hassan', 'Ali', 'Hattan', 'Salman', 'Fahad', 'Nasser', 'Abdulelah', 'Turki', 'Khalid', 'Sultan', 'Ayman', 'Feras', 'Talal', 'Rayan', 'Sami', 'Hussain'],
    lastNames: ['Al-Dawsari', 'Al-Shehri', 'Kanno', 'Al-Buraikan', 'Al-Ghannam', 'Al-Hassan', 'Al-Amri', 'Al-Malki', 'Al-Owais', 'Al-Faraj', 'Al-Shahrani', 'Al-Muwallad', 'Al-Abed', 'Otayf', 'Al-Bishi', 'Bahebri', 'Al-Najei', 'Al-Khaibari', 'Asiri', 'Tambakti', 'Al-Abid', 'Al-Hamdan', 'Al-Qahtani', 'Al-Yami', 'Al-Bulayhi'],
  },
  QAT: {
    code: 'QAT',
    name: 'Qatar',
    flag: '🇶🇦',
    region: 'Asia',
    firstNames: ['Akram', 'Almoez', 'Hassan', 'Abdelkarim', 'Boualem', 'Karim', 'Tarek', 'Bassam', 'Mohammed', 'Ismail', 'Pedro', 'Abdulaziz', 'Ahmed', 'Musab', 'Homam', 'Assim', 'Yousef', 'Meshaal', 'Khaled', 'Ro-Ro', 'Ali', 'Salem', 'Jassem', 'Saad', 'Hamza'],
    lastNames: ['Afif', 'Ali', 'Al-Haydos', 'Hassan', 'Khoukhi', 'Boudiaf', 'Salman', 'Al-Rawi', 'Muntari', 'Mohamad', 'Miguel', 'Hatem', 'Fathi', 'Khel', 'Ahmed', 'Madibo', 'Al-Hajri', 'Barsham', 'Al-Sheeb', 'Waad', 'Hatim', 'Al-Ahrak', 'Al-Yami', 'Gaber', 'Al-Raqi'],
  },
  CHN: {
    code: 'CHN',
    name: 'China',
    flag: '🇨🇳',
    region: 'Asia',
    firstNames: ['Wei', 'Lei', 'Hao', 'Xiang', 'Zheng', 'Peng', 'Jun', 'Long', 'Feng', 'Lin', 'Yu', 'Wu', 'Xu', 'Yin', 'Yan', 'Ao', 'Gao', 'Chen', 'Zhang', 'Liu', 'Tan', 'Song', 'Dong', 'Ming', 'Jian'],
    lastNames: ['Wu', 'Zhang', 'Li', 'Wang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Zhou', 'Lei', 'Hao', 'Yan', 'Wei', 'Jiang', 'Tan', 'Xu', 'Gao', 'Feng', 'Zheng', 'Sun', 'Zhu', 'Deng', 'Lin', 'Jin'],
  },
  UZB: {
    code: 'UZB',
    name: 'Uzbekistan',
    flag: '🇺🇿',
    region: 'Asia',
    firstNames: ['Eldor', 'Jaloliddin', 'Odil', 'Dostonbek', 'Bobir', 'Abbos', 'Davron', 'Khojimat', 'Islom', 'Otabek', 'Jamshid', 'Timur', 'Sardor', 'Akmal', 'Aziz', 'Sherzod', 'Oston', 'Rustam', 'Jasur', 'Husniddin', 'Dilshod', 'Ulugbek', 'Ikrom', 'Azizbek', 'Temur'],
    lastNames: ['Shomurodov', 'Masharipov', 'Akhmedov', 'Tursunov', 'Abdukholiqov', 'Fayzullaev', 'Norchaev', 'Shukurov', 'Urunov', 'Rashidov', 'Shomiyev', 'Kobilov', 'Khashimov', 'Nematov', 'Suyunov', 'Egamov', 'Sayfiev', 'Jalolov', 'Kholmatov', 'Yuldashev', 'Ibragimov', 'Ismoilov', 'Tulaganov', 'Zokirov', 'Karimov'],
  },
  IND: {
    code: 'IND',
    name: 'India',
    flag: '🇮🇳',
    region: 'Asia',
    firstNames: ['Sunil', 'Gurpreet', 'Sandesh', 'Anirudh', 'Lallianzuala', 'Brandon', 'Udanta', 'Ashique', 'Manvir', 'Sahal', 'Liston', 'Akash', 'Rahul', 'Pritam', 'Pronay', 'Subhasish', 'Nikhil', 'Amrinder', 'Ishan', 'Jerry', 'Mahesh', 'Anwar', 'Bipin', 'Nandhakumar', 'Jeakson'],
    lastNames: ['Chhetri', 'Singh', 'Jhingan', 'Thapa', 'Chhangte', 'Fernandes', 'Kumam', 'Kuruniyan', 'Singh', 'Abdul Samad', 'Colaco', 'Mishra', 'Bheke', 'Kotal', 'Halder', 'Bose', 'Poojary', 'Singh', 'Pandita', 'Mawihmingthanga', 'Singh Naorem', 'Ali', 'Singh', 'Pandiyan', 'Singh Thounaojam'],
  },
  THA: {
    code: 'THA',
    name: 'Thailand',
    flag: '🇹🇭',
    region: 'Asia',
    firstNames: ['Chanathip', 'Teerasil', 'Theerathon', 'Kawin', 'Supachai', 'Sarach', 'Sanrawat', 'Pansa', 'Suphanat', 'Ekanit', 'Korrakot', 'Bordin', 'Pathompol', 'Thanawat', 'Worachit', 'Suphanan', 'Chatchai', 'Peerapat', 'Chakrit', 'Kritsada', 'Adisak', 'Sumanya', 'Anon', 'Narubadin', 'Sasalak'],
    lastNames: ['Songkrasin', 'Dangda', 'Bunmathan', 'Thamsatchanan', 'Jaided', 'Yooyen', 'Dechmitr', 'Lalang', 'Mueanta', 'Panya', 'Wiriyaudomsiri', 'Phala', 'Chansri', 'Sripan', 'Kanitsribampen', 'Nisammit', 'Butprom', 'Puangjan', 'Noomsawat', 'Kanchanarak', 'Kraisorn', 'Purisai', 'Amornlertsak', 'Wongwai', 'Tangcharoen'],
  },

  // ============================================
  // NORTH/CENTRAL AMERICA & CARIBBEAN
  // ============================================
  USA: {
    code: 'USA',
    name: 'United States',
    flag: '🇺🇸',
    region: 'North America',
    firstNames: ['Christian', 'Weston', 'Tyler', 'Giovanni', 'Brenden', 'Sergino', 'Yunus', 'Timothy', 'Josh', 'Jesús', 'Walker', 'Chris', 'Jordan', 'Kellyn', 'Johnny', 'Brandon', 'Folarin', 'Malik', 'Cameron', 'Joe', 'Ricardo', 'Antonee', 'Miles', 'Haji', 'Brendan'],
    lastNames: ['Pulisic', 'McKennie', 'Adams', 'Reyna', 'Aaronson', 'Dest', 'Musah', 'Weah', 'Sargent', 'Ferreira', 'Zimmerman', 'Richards', 'Morris', 'Acosta', 'Cardoso', 'Vazquez', 'Balogun', 'Tillman', 'Carter-Vickers', 'Scally', 'Pepi', 'Robinson', 'Turner', 'Wright', 'Ream'],
  },
  MEX: {
    code: 'MEX',
    name: 'Mexico',
    flag: '🇲🇽',
    region: 'North America',
    firstNames: ['Raúl', 'Hirving', 'Edson', 'César', 'Diego', 'Guillermo', 'Andrés', 'Jesús', 'Alexis', 'Orbelín', 'Carlos', 'Luis', 'Uriel', 'Johan', 'Héctor', 'Jorge', 'Roberto', 'Kevin', 'Santiago', 'Gerardo', 'Erick', 'Fernando', 'Alan', 'Rodolfo', 'Henry'],
    lastNames: ['Jiménez', 'Lozano', 'Álvarez', 'Montes', 'Lainez', 'Ochoa', 'Guardado', 'Corona', 'Vega', 'Pineda', 'Rodríguez', 'Chávez', 'Antuna', 'Vásquez', 'Moreno', 'Sánchez', 'Alvarado', 'Gutiérrez', 'Giménez', 'Arteaga', 'Romo', 'Beltrán', 'Pulido', 'Cota', 'Martín'],
  },
  CAN: {
    code: 'CAN',
    name: 'Canada',
    flag: '🇨🇦',
    region: 'North America',
    firstNames: ['Alphonso', 'Jonathan', 'Cyle', 'Tajon', 'Stephen', 'Alistair', 'Samuel', 'Richie', 'Mark-Anthony', 'Kamal', 'Liam', 'Derek', 'Scott', 'Maxime', 'Atiba', 'Junior', 'Luca', 'Ismaël', 'Theo', 'Ali', 'Milan', 'David', 'Charles-Andreas', 'Jacob', 'Kyle'],
    lastNames: ['Davies', 'David', 'Larin', 'Buchanan', 'Eustáquio', 'Johnston', 'Piette', 'Laryea', 'Kaye', 'Miller', 'Fraser', 'Cornelius', 'Kennedy', 'Crépeau', 'Hutchinson', 'Hoilett', 'Kone', 'Koné', 'Corbeanu', 'Ahmed', 'Borjan', 'Wotherspoon', 'Brault-Guillard', 'Shaffelburg', 'Lareya'],
  },
  CRC: {
    code: 'CRC',
    name: 'Costa Rica',
    flag: '🇨🇷',
    region: 'North America',
    firstNames: ['Keylor', 'Bryan', 'Joel', 'Francisco', 'Jewison', 'Oscar', 'Yeltsin', 'Celso', 'Juan', 'Kendall', 'Anthony', 'Ronald', 'Gerson', 'Rándall', 'Johan', 'Alonso', 'Brandon', 'Carlos', 'Daniel', 'Jefferson', 'Ariel', 'Luis', 'Warren', 'Patrick', 'Andy'],
    lastNames: ['Navas', 'Ruiz', 'Campbell', 'Calvo', 'Bennette', 'Duarte', 'Tejeda', 'Borges', 'Vargas', 'Waston', 'Contreras', 'Matarrita', 'Torres', 'Leal', 'Venegas', 'Martínez', 'Aguilera', 'Mora', 'Chacón', 'Brenes', 'Lassiter', 'Díaz', 'Madrigal', 'Sequeira', 'Hernández'],
  },
  PAN: {
    code: 'PAN',
    name: 'Panama',
    flag: '🇵🇦',
    region: 'North America',
    firstNames: ['José', 'Eric', 'Aníbal', 'Michael', 'Harold', 'Fidel', 'Gabriel', 'César', 'Édgar', 'Rolando', 'Adalberto', 'Ismael', 'Alberto', 'Luis', 'Cristian', 'Abdiel', 'Cecilio', 'Alfredo', 'Freddy', 'Román', 'Jorman', 'Orlando', 'Andrés', 'Kevin', 'Jiovany'],
    lastNames: ['Fajardo', 'Davis', 'Godoy', 'Murillo', 'Cummings', 'Escobar', 'Torres', 'Yanis', 'Bárcenas', 'Blackburn', 'Carrasquilla', 'Díaz', 'Quintero', 'Mejía', 'Martínez', 'Ayarza', 'Waterman', 'Stephens', 'Góndola', 'Samudio', 'Harvey', 'Tanner', 'Andrade', 'Galván', 'Bonilla'],
  },
  JAM: {
    code: 'JAM',
    name: 'Jamaica',
    flag: '🇯🇲',
    region: 'North America',
    firstNames: ['Leon', 'Michail', 'Bobby', 'Ravel', 'Shamar', 'Kemar', 'Andre', 'Junior', 'Damion', 'Daniel', 'Kasey', 'Demarai', 'Ethan', 'Lamar', 'Joel', 'Oniel', 'Devon', 'Liam', 'Javain', 'Amari', 'Nathan', 'Greg', 'Ricardo', 'Javon', 'Jeadine'],
    lastNames: ['Bailey', 'Antonio', 'Reid', 'Morrison', 'Nicholson', 'Roofe', 'Gray', 'Flemmings', 'Lowe', 'Johnson', 'Palmer', 'Gray', 'Pinnock', 'Walker', 'Latibeaudiere', 'Fisher', 'Williams', 'Moore', 'Brown', 'East', 'Turgott', 'Leigh', 'Gardner', 'Anderson', 'White'],
  },
  HON: {
    code: 'HON',
    name: 'Honduras',
    flag: '🇭🇳',
    region: 'North America',
    firstNames: ['Luis', 'Alberth', 'Romell', 'Andy', 'Deybi', 'Edwin', 'Jonathan', 'Kervin', 'Boniek', 'Maynor', 'Joseph', 'Bryan', 'Rigoberto', 'Alejandro', 'Emilio', 'Diego', 'Kevin', 'Carlos', 'Cristian', 'Henry', 'Bryan', 'Jose', 'Orlando', 'Mario', 'Michael'],
    lastNames: ['Palma', 'Elis', 'Quioto', 'Najar', 'Flores', 'Rodríguez', 'Rubio', 'Arriaga', 'García', 'Figueroa', 'Rosales', 'Acosta', 'Rivas', 'Reyes', 'Izaguirre', 'Crisanto', 'Álvarez', 'Pineda', 'Pérez', 'Figueroa', 'Moya', 'Caballero', 'López', 'Martínez', 'Bengtson'],
  },
  SLV: {
    code: 'SLV',
    name: 'El Salvador',
    flag: '🇸🇻',
    region: 'North America',
    firstNames: ['Alex', 'Darwin', 'Ronald', 'Eriq', 'Joshua', 'Bryan', 'Nelson', 'Alexander', 'Eric', 'Kevin', 'Brayan', 'Jairo', 'Walmer', 'Oscar', 'Gerson', 'Mario', 'Eduardo', 'Narciso', 'Marvin', 'Rodolfo', 'Isaac', 'Jonathan', 'Melvin', 'Henry', 'Christian'],
    lastNames: ['Roldán', 'Cerén', 'Rodríguez', 'Zavaleta', 'Pérez', 'Tamacas', 'Bonilla', 'Larín', 'Calvillo', 'Reyes', 'Gil', 'Henríquez', 'Martínez', 'Ceren', 'Mayen', 'González', 'Orellana', 'Orosco', 'Monterroza', 'Zelaya', 'Portillo', 'Lara', 'Carrillos', 'Renderos', 'Amaya'],
  },

  // ============================================
  // ADDITIONAL COUNTRIES (51-100 range)
  // ============================================
  MNE: {
    code: 'MNE',
    name: 'Montenegro',
    flag: '🇲🇪',
    region: 'Europe',
    firstNames: ['Stefan', 'Adam', 'Marko', 'Fatos', 'Ilija', 'Mirko', 'Nebojša', 'Sead', 'Boris', 'Miloš', 'Dejan', 'Nikola', 'Risto', 'Damir', 'Ivan', 'Luka', 'Andrija', 'Vukan', 'Petar', 'Žarko'],
    lastNames: ['Savić', 'Vujačić', 'Jovović', 'Beciraj', 'Vukčević', 'Vujović', 'Ivović', 'Hakšabanović', 'Radunović', 'Marušić', 'Janković', 'Tomašević', 'Đurđević', 'Krstović', 'Camaj', 'Đukanović', 'Božović', 'Mugoša', 'Lagator', 'Šarkić'],
  },
  SVN: {
    code: 'SVN',
    name: 'Slovenia',
    flag: '🇸🇮',
    region: 'Europe',
    firstNames: ['Jan', 'Luka', 'Miha', 'Žan', 'Benjamin', 'Jaka', 'Sandi', 'Petar', 'Andraž', 'Timi', 'Adam', 'Nik', 'Josip', 'Domen', 'Dejan', 'Erik', 'Aljaz', 'David', 'Nejc', 'Kenan'],
    lastNames: ['Oblak', 'Iličić', 'Kampl', 'Šeško', 'Mlakar', 'Verbič', 'Lovrić', 'Stojanović', 'Balkovec', 'Bijol', 'Karničnik', 'Vipotnik', 'Zajc', 'Gnezda Čerin', 'Kurić', 'Sikošek', 'Celar', 'Blažič', 'Horvat', 'Vidmar'],
  },
  BIH: {
    code: 'BIH',
    name: 'Bosnia and Herzegovina',
    flag: '🇧🇦',
    region: 'Europe',
    firstNames: ['Edin', 'Miralem', 'Emir', 'Amer', 'Sead', 'Haris', 'Ermedin', 'Anel', 'Rade', 'Denis', 'Armin', 'Kenan', 'Benjamin', 'Ermin', 'Amar', 'Adnan', 'Vedad', 'Semir', 'Muhamed', 'Damir'],
    lastNames: ['Džeko', 'Pjanić', 'Kolašinac', 'Gojak', 'Ahmedhodžić', 'Kadušić', 'Demirović', 'Bičakčić', 'Begović', 'Sarić', 'Hajradinović', 'Kodro', 'Mehić', 'Dolić', 'Ramić', 'Ibrahimović', 'Bajić', 'Civic', 'Bešić', 'Hadžić'],
  },
  ALB: {
    code: 'ALB',
    name: 'Albania',
    flag: '🇦🇱',
    region: 'Europe',
    firstNames: ['Armando', 'Elseid', 'Marash', 'Berat', 'Keidi', 'Nedim', 'Thomas', 'Ivan', 'Kristjan', 'Ardian', 'Taulant', 'Etrit', 'Rey', 'Myrto', 'Klaus', 'Qazim', 'Enis', 'Jasir', 'Amir', 'Ernest'],
    lastNames: ['Broja', 'Hysaj', 'Kumbulla', 'Gjimshiti', 'Bare', 'Bajrami', 'Strakosha', 'Balliu', 'Asllani', 'Ismajli', 'Xhaka', 'Berisha', 'Manaj', 'Uzuni', 'Gjasula', 'Laçi', 'Hoxha', 'Asani', 'Abrashi', 'Muçi'],
  },
  MKD: {
    code: 'MKD',
    name: 'North Macedonia',
    flag: '🇲🇰',
    region: 'Europe',
    firstNames: ['Eljif', 'Goran', 'Stefan', 'Darko', 'Boban', 'Visar', 'Ezgjan', 'Tihomir', 'Stole', 'Milan', 'Aleksandar', 'David', 'Elif', 'Enis', 'Arijan', 'Marjan', 'Vlatko', 'Krste', 'Darek', 'Besart'],
    lastNames: ['Elmas', 'Pandev', 'Ristovski', 'Velkovski', 'Nikolov', 'Musliu', 'Alioski', 'Kostadinov', 'Dimitrievski', 'Ristevski', 'Trajkovski', 'Babunski', 'Bardhi', 'Ademi', 'Churlinov', 'Stojanovski', 'Spirovski', 'Todorovski', 'Atanasov', 'Avramovski'],
  },
  GEO: {
    code: 'GEO',
    name: 'Georgia',
    flag: '🇬🇪',
    region: 'Europe',
    firstNames: ['Khvicha', 'Giorgi', 'Guram', 'Levan', 'Saba', 'Davit', 'Zurab', 'Otar', 'Giorgi', 'Lasha', 'Nika', 'Tornike', 'Jaba', 'Solomon', 'Anzor', 'Valeri', 'Jemal', 'Budu', 'Irakli', 'Dato'],
    lastNames: ['Kvaratskhelia', 'Mamardashvili', 'Kashia', 'Kiteishvili', 'Lobzhanidze', 'Chakvetadze', 'Davitashvili', 'Gvelesiani', 'Kverkvelia', 'Dvali', 'Arabidze', 'Mekvabishvili', 'Tsitaishvili', 'Zivzivadze', 'Kvilitaia', 'Qazaishvili', 'Ananidze', 'Mikautadze', 'Lochoshvili', 'Gagnidze'],
  },
  ARM: {
    code: 'ARM',
    name: 'Armenia',
    flag: '🇦🇲',
    region: 'Europe',
    firstNames: ['Henrikh', 'Sargis', 'Hovhannes', 'Tigran', 'Artak', 'Varazdat', 'Arman', 'David', 'Lucas', 'Georgy', 'Eduard', 'Arsen', 'Aleksandre', 'Nair', 'Zhirayr', 'Khoren', 'Erik', 'Vahan', 'Karen', 'Styopa'],
    lastNames: ['Mkhitaryan', 'Adamyan', 'Hambardzumyan', 'Barseghyan', 'Haroyan', 'Hovhannisyan', 'Udo', 'Zelarayan', 'Spertsyan', 'Bichakhchyan', 'Briasco', 'Voskanyan', 'Abelyan', 'Tiknizyan', 'Dashyan', 'Grigoryan', 'Petrosyan', 'Babayan', 'Calisir', 'Harutyunyan'],
  },
  KSV: {
    code: 'KSV',
    name: 'Kosovo',
    flag: '🇽🇰',
    region: 'Europe',
    firstNames: ['Vedat', 'Milot', 'Arber', 'Florent', 'Edon', 'Amir', 'Elbasan', 'Mergim', 'Valon', 'Besar', 'Fidan', 'Lirim', 'Arbër', 'Mërgim', 'Leart', 'Alban', 'Florian', 'Muharrem', 'Ibrahim', 'Benjamin'],
    lastNames: ['Muriqi', 'Rashica', 'Zeneli', 'Hadergjonaj', 'Zhegrova', 'Rrahmani', 'Rashani', 'Vojvoda', 'Berisha', 'Halimi', 'Kastrati', 'Kololli', 'Muslija', 'Kryeziu', 'Paqarada', 'Shala', 'Aliti', 'Sahiti', 'Dresevic', 'Bytyqi'],
  },
  BUL: {
    code: 'BUL',
    name: 'Bulgaria',
    flag: '🇧🇬',
    region: 'Europe',
    firstNames: ['Kiril', 'Georgi', 'Ivelin', 'Dimitar', 'Todor', 'Bozhidar', 'Kraev', 'Ilian', 'Martin', 'Vasil', 'Anton', 'Valentin', 'Spas', 'Atanas', 'Nikolay', 'Kristiyan', 'Aleksandar', 'Stanislav', 'Dominik', 'Birsent'],
    lastNames: ['Despodov', 'Minchev', 'Popov', 'Iliev', 'Nedelev', 'Kraev', 'Kostadinov', 'Delev', 'Tsvetanov', 'Bozhikov', 'Chochev', 'Antov', 'Gruev', 'Yankov', 'Turitsov', 'Shopov', 'Yomov', 'Dimitrov', 'Ivanov', 'Hristov'],
  },
};

// ============================================
// NATIONALITY WEIGHTS FOR ENGLISH LEAGUE
// ============================================
export const NATIONALITY_WEIGHTS: Record<string, number> = {
  // England - 35%
  ENG: 0.35,
  
  // British Isles - 8%
  SCO: 0.025,
  WAL: 0.025,
  IRL: 0.02,
  NIR: 0.01,
  
  // Western Europe - 18%
  FRA: 0.04,
  ESP: 0.03,
  GER: 0.025,
  ITA: 0.02,
  POR: 0.025,
  NED: 0.02,
  BEL: 0.02,
  
  // Scandinavia - 4%
  DEN: 0.012,
  SWE: 0.012,
  NOR: 0.012,
  FIN: 0.002,
  ISL: 0.002,
  
  // Eastern Europe - 6%
  POL: 0.012,
  CRO: 0.01,
  SRB: 0.008,
  UKR: 0.008,
  CZE: 0.006,
  SUI: 0.006,
  
  // South America - 12%
  BRA: 0.04,
  ARG: 0.03,
  COL: 0.015,
  URU: 0.015,
  ECU: 0.01,
  CHI: 0.01,
  
  // Africa - 10%
  NGA: 0.025,
  SEN: 0.02,
  GHA: 0.015,
  CIV: 0.01,
  MAR: 0.01,
  EGY: 0.01,
  CMR: 0.01,
  
  // Asia & Oceania - 4%
  JPN: 0.015,
  KOR: 0.01,
  AUS: 0.01,
  IRN: 0.005,
  
  // North America - 3%
  USA: 0.015,
  MEX: 0.01,
  CAN: 0.005,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a random nationality based on weights
 */
export function getRandomNationality(): Nationality {
  const random = Math.random();
  let cumulative = 0;
  
  for (const [code, weight] of Object.entries(NATIONALITY_WEIGHTS)) {
    cumulative += weight;
    if (random < cumulative && NATIONALITIES[code]) {
      return NATIONALITIES[code];
    }
  }
  
  // Fallback to England
  return NATIONALITIES.ENG;
}

/**
 * Get a specific nationality by code
 */
export function getNationality(code: string): Nationality | undefined {
  return NATIONALITIES[code];
}

/**
 * Generate a player name for a given nationality
 */
export function generatePlayerName(nationality: Nationality): string {
  const firstName = nationality.firstNames[Math.floor(Math.random() * nationality.firstNames.length)];
  const lastName = nationality.lastNames[Math.floor(Math.random() * nationality.lastNames.length)];
  return `${firstName} ${lastName}`;
}

/**
 * Get all nationality codes
 */
export function getAllNationalityCodes(): string[] {
  return Object.keys(NATIONALITIES);
}

/**
 * Get nationalities by region
 */
export function getNationalitiesByRegion(region: string): Nationality[] {
  return Object.values(NATIONALITIES).filter(n => n.region === region);
}

/**
 * Get all available regions
 */
export function getAllRegions(): string[] {
  return [...new Set(Object.values(NATIONALITIES).map(n => n.region))];
}
