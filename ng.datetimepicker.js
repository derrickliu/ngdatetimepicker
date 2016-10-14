import './ng.datetimepicker.css';

var template = require('./ng.datetimepicker.templates.html');
angular.module('ngDatetimepicker', [])
	// ng select官方option为number的解决方案
	.directive('convertToNumber', function() {
		return {
			require: 'ngModel',
			link: function(scope, element, attrs, ngModel) {
				ngModel.$parsers.push(function(val) {
					return parseInt(val, 10);
				});
				ngModel.$formatters.push(function(val) {
					return '' + val;
				});
			}
		}
	})
	.directive('ngDatetimepicker', function($filter) {
		return {
			restrict: 'A',
			require: 'ngModel',
			template: template,
			scope: {
				datetime: '=ngModel',
				_config: '=ngDatetimepicker',
				onChange: '=onChange'
			},
			link: function(scope, elem) {
				scope.hideDatePanel = true;
				

				elem.on('click', function(e) {
					if ($.contains(e.currentTarget, e.target) && !(($(e.target).closest('.sure').length && !$(e.target).closest('.disabled').length) || $(e.target).parent().is('.input-group') || !scope.config.showTime && $(e.target).is('.day'))) {
						scope.hideDatePanel = false;
					}
				});

				elem.find('.dropdown').on('show.bs.dropdown', function() {
					var date = scope.datetime ?
						new Date(scope.datetime) :
						(scope.config.minDate ?
							new Date(scope.config.minDate) :
							(scope.config.maxDate ? new Date(scope.config.maxDate) : new Date()));
					scope.$apply(function() {
						scope.updateDateTimePanel(date.getFullYear(),
							date.getMonth(),
							date.getDate(),
							date.getHours(),
							date.getMinutes(),
							date.getSeconds());
					});
				})
				.on('hide.bs.dropdown', function(e) {
					if (!scope.hideDatePanel) {
						scope.hideDatePanel = true;
						return false;
					}
					return true;
				});
			},
			controller: function($scope) {
				$scope.config = {
					showTime: true,
					placeholder: '',
					format: $scope._config.showTime != false ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd',
					output: 'string',
					name: '',
					readonly: false
				};
				$.extend($scope.config, $scope._config);

				$scope.$watch('_config',function(){
					$.extend($scope.config, $scope._config);
				},true);

				$scope.activeDate = null;

				// 随机生成一个id
				$scope.datetimepickerinput = Math.random().toString(36).substr(2);

				$scope.months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

				$scope.time = {
					hour: {
						max: 23,
						min: 0
					},
					minute: {
						max: 59,
						min: 0
					},
					second: {
						max: 59,
						min: 0
					}
				};

				$scope.updateDateTimePanel = function(y, m, d, h, min, s) {
					var _date = new Date(),
						today = _date.getDate(),
						todayYear = _date.getFullYear(),
						todayMonth = _date.getMonth(),

						// 当前月有多少天
						totalDays = new Date(y, m + 1, 0).getDate(),
						// 上一个月的天数
						prevTotalDays = new Date(y, m, 0).getDate(),
						// 当前月1号是星期几
						weekDay = new Date(y, m, 1).getDay(),

						days = [];

					// 1号为星期天的时候，前面补齐一个星期上月的日期
					if (weekDay == 0) {
						weekDay = 7;
					}

					// 填充上个月的日期
					while (weekDay > 0) {
						days[weekDay - 1] = {
							status: 'old',
							day: prevTotalDays,
							timestamp: y + '-' + m + '-' + prevTotalDays
						};

						weekDay--;
						prevTotalDays--;
					}

					// 填充这个月的日期
					var i = 1;

					while (i <= totalDays) {
						var oDate = {
							day: i,
							timestamp: y + '-' + (m+1) + '-' + i
						};
						if (isActiveDate(y, m, d, i)) {
							oDate.status = 'active';
						}
						if (todayYear == y && todayMonth == m && i == today) {
							if (oDate.status != 'active') {
								oDate.status = 'today';
							}
							oDate.today = true;
						}

						if (oDate.status == 'active') {
							$scope.activeDate = {
								status: oDate.status,
								day: i,
								today: oDate.today,
								timestamp: y + '-' + (m+1) + '-' + i
							}
							days.push($scope.activeDate);

							// 如果显示时间，这里需要把时间的范围设置
							setTimeRange(y,m,i);
						} else {
							days.push(oDate);
						}
						i++;
					}

					// 填充下个月的数据
					// 上面的数据不够 6 * 7 = 42的格子
					while (days.length < 42) {
						days.push({
							status: 'new',
							day: (i++) - totalDays,
							timestamp: y + '-' + (m+2) + '-' + (i - totalDays)
						});
					}

					var dates = [];
					for (var i = 0; i < days.length; i++) {
						if (i % 7 == 0) {
							dates.push([]);
						}
						dates[dates.length - 1].push(days[i]);
					}

					// model set
					$scope.dates = dates;
					$scope.years = [];
					for (var _y = y - 5; _y <= y + 5; _y++) {
						$scope.years.push(_y);
					}
					$scope.year = y;
					$scope.month = m + 1;

					if (d) {
						$scope.date = d;
					}

					if ($scope.config.showTime && h) {
						$scope.hour = h;
						$scope.minute = min;
						$scope.second = s;
					}

					// 遍历一遍，看是否要加上disabled
					setDateRange(days);
					setYearMonthRange(y,m);
				}

				function isActiveDate(y, m, d, i) {
					var _date;
					if ($scope.ison && i == $scope.date) {
						$scope.ison = false;
						return true;
					}
					if ($scope.datetime) {
						_date = new Date($scope.datetime);
						if (y == _date.getFullYear() && m == _date.getMonth() && i == _date.getDate()) {
							return true;
						}
					}
					return false;
				}

				function setYearMonthRange(y,m){
					var maxDate,
						maxDateYear,
						maxDateMonth,

						minDate,
						minDateYear,
						minDateMonth;
					if($scope.config.maxDate){
						maxDate = new Date($scope.config.maxDate);
						maxDateYear = maxDate.getFullYear();
						maxDateMonth = maxDate.getMonth();
						$scope.nextDisabled = (y >= maxDateYear && m >= maxDateMonth);
					}

					if($scope.config.minDate){
						minDate = new Date($scope.config.minDate);
						minDateYear = minDate.getFullYear();
						minDateMonth = minDate.getMonth();
						$scope.prevDisabled = (y <= minDateYear && m <= minDateMonth);
					}
					if(maxDate || minDate){
						$scope.months = [];
						$scope.years = [];
					}

					if($scope.config.maxDate && $scope.config.minDate){
						for(var _y = minDateYear; _y <= maxDateYear; _y++){
							$scope.years.push(_y);
						}
						var startMonth,
							endMonth;
						if(y == minDateYear && y == maxDateYear){
							startMonth = minDateMonth + 1;
							endMonth = maxDateMonth + 1;
						}else if(y == minDateYear){
							startMonth = minDateMonth + 1;
							endMonth = 12;
						}else if(y == maxDateYear){
							startMonth = 1;
							endMonth = maxDateMonth + 1;
						}else{
							startMonth = 1;
							endMonth = 12;
						}

						for(var _m = startMonth; _m <= endMonth; _m++){
							$scope.months.push(_m);
						}

						if(y == minDateYear && $scope.month < minDateMonth + 1){
							$scope.month = minDateMonth + 1;
							$scope.yearMonthChange();
						}else if(y == maxDateYear && $scope.month > maxDateMonth + 1){
							$scope.month = maxDateMonth + 1;
							$scope.yearMonthChange();
						}
					}else if($scope.config.maxDate){

						if(y >= maxDateYear){
							for(var _y = maxDateYear - 10; _y <= maxDateYear; _y++){
								$scope.years.push(_y);
							}
							for(var _m = 1; _m <= maxDateMonth + 1; _m++){
								$scope.months.push(_m);
							}
							if($scope.month > maxDateMonth + 1){
								$scope.month = maxDateMonth + 1;
								$scope.yearMonthChange();
							}
						}else{
							for (var _y = y - 5; _y <= maxDateYear; _y++) {
								$scope.years.push(_y);
							}
							$scope.months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
						}
					}else if($scope.config.minDate){

						if(y <= minDateYear){
							for(var _y = minDateYear; _y < minDateYear + 10; _y++){
								$scope.years.push(_y);
							}
							for(var _m = minDateMonth + 1; _m <= 12; _m++){
								$scope.months.push(_m);
							}
							if($scope.month < minDateMonth + 1){
								$scope.month = minDateMonth + 1;
								$scope.yearMonthChange();
							}
						}else{
							for (var _y = minDateYear; _y <= y + 5; _y++) {
								$scope.years.push(_y);
							}
							$scope.months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
						}
					}
				}

				function setDateRange(days){
					var maxDate,minDate;
					if($scope.config.maxDate){
						maxDate = new Date($scope.config.maxDate).getTime();
					}
					if($scope.config.minDate){
						minDate = new Date($scope.config.minDate).getTime();
					}
					if(!maxDate && !minDate) return;

					for(var i = 0; i < 42; i++){
						var daysTimestamp = days[i].timestamp;
						if(maxDate && new Date(daysTimestamp).getTime() > maxDate 
							|| minDate && new Date(daysTimestamp + ' 23:59:59').getTime() < minDate){
							days[i].disabled = true;
						}
					}

					// 今天 现在
					var now = new Date().getTime();
					if(now > maxDate || now < minDate){
						$scope.todayDis = true;
					}else{
						$scope.todayDis = false;
					}
					
				}

				function setTimeRange(y,m,d){
					var maxDate,
						minDate;
					if($scope.config.maxDate){
						maxDate = new Date($scope.config.maxDate);
					}

					if($scope.config.minDate){
						minDate = new Date($scope.config.minDate);
					}

					if(maxDate && maxDate.getDate() == d){
						$scope.time.hour.max = maxDate.getHours();
						// $scope.time.minute.max = maxDate.getMinutes();
						// $scope.time.second.max = maxDate.getSeconds();

						$scope.hour = Math.min($scope.hour, $scope.time.hour.max);
						
						$scope.hourChange();
					}else if(minDate && minDate.getDate() == d){
						$scope.time.hour.min = minDate.getHours();
						// $scope.time.minute.min = minDate.getMinutes();
						// $scope.time.second.min = minDate.getSeconds();

						$scope.hour = Math.max($scope.hour, $scope.time.hour.min);
						
						$scope.hourChange();
					}else{
						$scope.time.hour.max = 23;
						$scope.time.minute.max = 59;
						$scope.time.second.max = 59;

						$scope.time.hour.min = 0;
						$scope.time.minute.min = 0;
						$scope.time.second.min = 0;
					}
				}

				$scope.yearMonthChange = function() {
					// 更新日期面板
					$scope.updateDateTimePanel($scope.year, $scope.month - 1);
				}

				$scope.hourChange = function(){
					if(!$scope.hour){
						$scope.hour = $scope.time.hour.min;
					}

					var minDate,
						maxDate;

					if($scope.config.minDate){
						minDate = new Date($scope.config.minDate);
						if($scope.date == minDate.getDate()){
							if($scope.hour > minDate.getHours()){
								$scope.time.minute.min = 0;
								$scope.time.second.min = 0;
							}else{
								$scope.time.minute.min = minDate.getMinutes();
								// $scope.time.second.min = minDate.getSeconds();

								$scope.minute = Math.max($scope.minute, $scope.time.minute.min);
								$scope.minuteChange();
								// $scope.second = Math.max($scope.second, $scope.time.second.min);
							}
						}
					}

					if($scope.config.maxDate){
						maxDate = new Date($scope.config.maxDate);
						if($scope.date == maxDate.getDate()){
							if($scope.hour < maxDate.getHours()){
								$scope.time.minute.max = 59;
								$scope.time.second.max = 59;
							}else{
								$scope.time.minute.max = maxDate.getMinutes();
								// $scope.time.second.max = maxDate.getSeconds();

								$scope.minute = Math.min($scope.minute, $scope.time.minute.max);
								$scope.minuteChange();
								// $scope.second = Math.min($scope.second, $scope.time.second.max)
							}
						}
					}

				}

				$scope.minuteChange = function(){
					if(!$scope.minute){
						$scope.minute = $scope.time.minute.min;
					}
					var minDate,
						maxDate;

					if($scope.config.minDate){
						minDate = new Date($scope.config.minDate);
						if($scope.date == minDate.getDate() && $scope.hour == minDate.getHours()){
							if($scope.minute > minDate.getMinutes()){
								$scope.time.second.min = 0;
							}else{
								$scope.time.second.min = minDate.getSeconds();

								$scope.second = Math.max($scope.second, $scope.time.second.min)
							}
						}
					}

					if($scope.config.maxDate){
						maxDate = new Date($scope.config.maxDate);
						if($scope.date == maxDate.getDate() && $scope.hour == maxDate.getHours()){
							if($scope.minute < maxDate.getMinutes()){
								$scope.time.second.max = 59;
							}else{
								$scope.time.second.max = maxDate.getSeconds();

								$scope.second = Math.min($scope.second, $scope.time.second.max)
							}
						}
					}

				}

				$scope.secondChange = function(){
					if(!$scope.minute){
						$scope.minute = $scope.time.minute.min;
					}
				}

				$scope.prevMonth = function() {
					if($scope.prevDisabled) return;
					var m = $scope.month - 1;
					if (m <= 0) {
						m = 12;
						$scope.year -= 1;
					}
					$scope.month = m;
					$scope.updateDateTimePanel($scope.year, $scope.month - 1);
				}

				$scope.nextMonth = function() {
					if($scope.nextDisabled) return;
					var m = $scope.month + 1;
					if (m > 12) {
						m = 1;
						$scope.year += 1;
					}
					$scope.month = m;
					$scope.updateDateTimePanel($scope.year, $scope.month - 1);
				}

				$scope.dateSelect = function(date) {
					if(date.disabled) return;

					$scope.date = date.day;
					if (!$scope.config.showTime) {
						if (date.status == 'old') {
							$scope.prevMonth();
						} else if (date.status == 'new') {
							$scope.nextMonth();
						}
						getResult();
						return;
					}

					$scope.hideDatePanel = false;

					// 上一个选中状态
					// for(var i = 0)
					if ($scope.activeDate) {
						// 要判断这一天是不是当天，是当天就要把status改成today
						if ($scope.activeDate.today) {
							$scope.activeDate.status = 'today';
						} else {
							$scope.activeDate.status = '';
						}
					}

					if (date.status == 'old') {
						$scope.ison = true;
						$scope.prevMonth();
					} else if (date.status == 'new') {
						$scope.ison = true;
						$scope.nextMonth();
					} else {
						date.status = 'active';
						$scope.activeDate = date;
					}

					setTimeRange($scope.year, $scope.month ,date.day);
				}

				$scope.sure = function() {
					getResult();
				}

				function getResult() {
					var old = $scope.datetime;

					var ds = $scope.year + '-' + $scope.month + '-' + z($scope.date);

					if ($scope.config.showTime) {
						ds += ' ' + z($scope.hour) + ':' + z($scope.minute) + ':' + z($scope.second);
					}
					switch ($scope.config.output) {
						case 'string':
							$scope.datetime = $filter('date')(new Date(ds), $scope.config.format);
							break;
						case 'object':
							$scope.datetime = new Date(ds);
							break;
						case 'timestamp':
							$scope.datetime = new Date(ds).getTime();
							break;
							// no default
					}

					if ($scope.onChange) {
						$scope.onChange($scope.datetime, old);
					}
				}

				function z(num) {
					return num < 10 ? ('0' + num) : num;
				}

				$scope.today = function() {
					if($scope.todayDis){
						return;
					}
					var now = new Date();
					$scope.year = now.getFullYear();
					$scope.month = now.getMonth() + 1;
					$scope.date = now.getDate();
					$scope.hour = now.getHours();
					$scope.minute = now.getMinutes();
					$scope.second = now.getSeconds();
					getResult();
				}

			}
		}
	});