const debug = true
nxGamesCollection = angular.module("nxGamesCollection", [])

nxGamesCollection.controller('MainController', ['$scope', '$http', function($scope, $http) {
	$scope.sort = {
		fields: [
			{
				field: 'updatedAt',
				label: 'Date added'
			},
			{
				field: 'name',
				label: 'Name'
			},
			{
				field: 'ratingValue',
				label: 'Rating'
			},
			{
				field: 'released',
				label: 'Released'
			},
		],
		field: 'updatedAt',
		asc: false
	}

	$scope.ratingDisplayTypes = {}
	$scope.ratingDisplayTypesArray = []
	$scope.maxPlatformsToShow = 4
	$scope.gamesLimit = 10

	$scope.loading = true

	$scope.search = ''
	$scope.games = []
	$scope.filteredGames = []

	$http.get('data/games.json')
	.then(response => {
		$scope.games = response.data
		$scope.lastUpdated = moment(_.maxBy($scope.games, 'updatedAt').updatedAt).format('MMMM DD, YYYY')
		$scope.lastPopular = _($scope.games).filter(game => game.ratingDisplay === 'exceptional').maxBy('updatedAt')
	})
	.finally(() => {
		$scope.loading = false
		$scope.filterGames()
	})

	$scope.addGameLimit = function () {
		$scope.gamesLimit += 10
	}

	$scope.changeSort = function ({field = undefined, asc = undefined}) {
		if (field !== undefined) {
			$scope.sort.field = field
		}

		if (asc !== undefined) {
			$scope.sort.asc = asc
		}
	}

	$scope.toggleRateDisplayType = function (rateDisplayType) {
		console.log(rateDisplayType)
		$scope.ratingDisplayTypes[rateDisplayType].active = !$scope.ratingDisplayTypes[rateDisplayType].active
		$scope.filterGames()
	}

	$scope.capitalize = function (str) {
		return str.charAt(0).toUpperCase() + str.substr(1)
	}

	$scope.filterGames = function () {
		$scope.filteredGames = _.filter($scope.games, game => {
			if ($scope.search) {
				if (!game.name.toLowerCase().match($scope.search.toLowerCase())) {
					return false
				}
			}

			return true
		})

		$scope.ratingDisplayTypes = _($scope.filteredGames)
									.map(game => game.ratingDisplay)
									.groupBy()
									.mapKeys((values, rateDisplayType) => {
										return rateDisplayType === 'null' ? 'Other' : rateDisplayType
									})
									.mapValues((values, rateDisplayType) => {
										return {
											key: rateDisplayType,
											label: $scope.capitalize(rateDisplayType),
											count: values.length,
											active: $scope.ratingDisplayTypes[rateDisplayType] ? $scope.ratingDisplayTypes[rateDisplayType].active : false
										}
									})
									.value()

		$scope.ratingDisplayTypesArray = _.orderBy($scope.ratingDisplayTypes, value => {
											let key = value.key

											if (key === 'exceptional') {
												return 1
											} else if (key === 'recommended') {
												return 2
											} else if (key === 'meh') {
												return 3
											} else if (key === 'skip') {
												return 4
											} else {
												return 5
											}
										})

		$scope.filteredGames = _.filter($scope.filteredGames, game => {
			let activeRatingDisplayTypesFilters = _.filter($scope.ratingDisplayTypes, ratingDisplayType => ratingDisplayType.active).map(ratingDisplayType => ratingDisplayType.key)

			if (activeRatingDisplayTypesFilters.length > 0) {
				if (!activeRatingDisplayTypesFilters.includes(game.ratingDisplay)) {
					return false
				}
			}

			return true
		})

		$scope.gamesLimit = 10
	}
}])

if (!debug)
	console.log = function () {}
