# DayLog Mobile - Future Features & Improvements

Ce document rassemble plusieurs idées d'améliorations et de nouvelles fonctionnalités pour amener l'application DayLog au niveau supérieur, tant sur le plan fonctionnel que visuel.

## 1. Graphiques et Visualisation Avancée (Data Viz) 📊
Remplacer ou accompagner la simple liste des "Time by Tag" par des graphiques sophistiqués :
- **Donut Chart (Graphique en anneau)** : Chaque tranche utiliserait la couleur exacte de l'étiquette (`tag.dot`) pour un aperçu visuel immédiat de la répartition de la journée, semaine ou mois.
- **Bar Chart (Graphique en barres)** : Pour comparer son temps de travail d'un jour à l'autre de manière très visuelle.

## 2. Modification Manuelle (Drag & Drop) 🛠️
Actuellement, si l'on oublie d'éteindre un minuteur, le temps est faussé.
- **Édition Rapide** : Clic long sur un bloc dans la `TimelineScreen` pour modifier son heure de début ou de fin manuellement.
- **Interface Intelligente** : Un tiroir (BottomSheet) permettant d'éditer la durée totale d'une session terminée.

## 3. Objectifs Quotidiens (Daily Goals) 🎯
Créer une composante de motivation ("Gamification") :
- **Temps Cible** : Pouvoir définir des objectifs par tag (ex: "2h de *Study*", "1h de *Sport*").
- **Barre de Progression** : Afficher une petite barre de progression élégante sur l'écran d'accueil (`TodayScreen`) ou dans l'onglet `Stats` qui se remplit en direct chronomètre en main.

## 4. Rappels et Alertes Anti-oubli 🔔
Éviter l'effet redouté du minuteur qui tourne toute la nuit :
- **Notifications Locales** : Utiliser *Expo Notifications* pour avertir l'utilisateur si un minuteur tourne sans interruption depuis plus de 2 heures.
- **Alerte Douce** : "Êtes-vous toujours sur la tâche X ? Ne pas oublier de faire une pause !"

## 5. Micro-animations et UI/UX ✨
Renforcer l'aspect dynamique et premium ("satisfaisant") de l'application :
- **Transitions** : Animations fluides lors de la sélection d'un Tag ou de l'expansion d'une tâche.
- **Lottie Confettis** : Lorsqu'une tâche est marquée comme complétée ("Done ✓"), déclencher une micro-animation de célébration.

## 6. Théorie vs Réalité (Timeboxing vs Time Tracking) ⏳
C'est LA fonctionnalité 'Killer Feature' :
- **Heures Prévues** : Permettre à l'utilisateur de définir une estimation ou une plage horaire prévue pour chaque tâche (ex: "Je prévois 2h").
- **Tableau de Bord Comparatif** : Une vue spéciale dans l'onglet Stats qui affiche l'écart entre l'idéal théorique et la réalité chronométrée.
- **Jauges Visuelles** : Des barres qui deviennent rouges si l'on dépasse le temps alloué !

## 7. Exportation et Synchronisation des Données 📥
Passer d'une approche 100% stockage local à une approche plus ouverte :
- **Export CSV / PDF** : Un bouton pour télécharger l'historique complet de son temps dans un fichier lisible par Excel.
- **Sync Légère** : Outil de sauvegarde dans le Cloud (ex: Google Drive ou iCloud) pour ne pas perdre ses temps si l'on désinstalle l'application.

---

## 8. Liste des Correctifs et Évolutions (To-Do V1.1) 🐛
Voici la liste des comportements identifiés à fixer prioritairement :
- [ ] **Démarrage verrouillé au jour J (Aujourd'hui)** : Actuellement, impossible de lancer une activité si l'on se trouve dans la vue d'un jour passé ou futur, limitant l'utilisation.
- [ ] **Chevauchement des tâches sur le lendemain** : Réfléchir à la gestion des tâches démarrées la veille (ex: 23h30) qui tournent toujours mais n'apparaissent pas sur la Timeline du lendemain matin (Oiseaux de nuit).
- [ ] **Couleur de l'icône du Logo** : Mettre à jour l'icône nouvellement générée pour utiliser le violet dominant au lieu du jaune/orange, afin de mieux correspondre à l'interface de l'application.
- [ ] **Visibilité Nocturne (00h - 06h)** : L'échelle de la Timeline masque actuellement la période entre Minuit et 6h du matin, il faudrait modifier cette restriction pour afficher les 24h complètes.
