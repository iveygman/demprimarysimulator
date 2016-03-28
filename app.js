var delegateApp = angular.module('delegateApp', []);
var allDelegates = {}, delegatesToWin = {};	
var drawCount = 0;
allDelegates.democrats = 4765;
delegatesToWin.democrats = 2383;

var originalData = {};

delegateApp.controller('DataCtrl', function($scope, $http) {
	$http.get('primarydata.json').then(function(res){
		$scope.totalDelegates = {};
        $scope.hovered = function(d){
            $scope.barValue = d;
            $scope.$apply();
        };
		$scope.options = {width: 500, height: window.innerHeight * 0.75, 'bar': 'aaa'};
		$scope.parties = res.data.parties;
		$scope.allDelegates = allDelegates;
		$scope.delegatesToWin = delegatesToWin;

		// TODO(iveygman): generalize this
		$scope.democratsuperdelegates = res.data.democratsuperdelegates;
		$scope.democrats = res.data.democrats;
		$scope.democratnames = res.data.democratcandidates;

		for (i in $scope.democrats) {
			var notSet = $scope.democrats[i].Clinton.actual == null;
			$scope.democrats[i].notYetSet = notSet;
			$scope.democrats[i].totalDelegates = 0;
			for (j in $scope.democratnames) {
				var name = $scope.democratnames[j];
				$scope.democrats[i][name].modeledDelegates = $scope.democrats[i][name].expected;
				$scope.democrats[i].totalDelegates += $scope.democrats[i][name].expected;
			}
		}
		$scope.originalData = {};
		$scope.originalData.democrats = $scope.democrats;
		$scope.updateModel();
	});

	$scope.superDelegatesEnabled = false;
	$scope.toggleSuperDelegates = function() {
		$scope.superDelegatesEnabled = !$scope.superDelegatesEnabled;
		$scope.updateModel();
	}

	$scope.superDelegatesDidChange = function(sandersDelegates) {
		$scope.democratsuperdelegates.Sanders = parseInt(sandersDelegates, 10);
		$scope.democratsuperdelegates.Clinton = $scope.democratsuperdelegates.total - $scope.democratsuperdelegates.Sanders;
		$scope.updateModel();
	}

	$scope.updateModel = function() {
		if (!$scope.superDelegatesEnabled) {
			$scope.democratsuperdelegates.Sanders = $scope.democratsuperdelegates.Clinton = 0;
		}
		$scope.sumAllDemocraticDelegates();
		$scope.data = [$scope.totalDelegates.Clinton, $scope.totalDelegates.Sanders];
	}

	$scope.reset = function() {
		$scope.superDelegatesEnabled = false;
		for (i in $scope.democrats) {
			if ($scope.democrats[i].notYetSet) {
				$scope.democrats[i].Sanders.modeledDelegates = $scope.democrats[i].Sanders.expected;
				$scope.democrats[i].Clinton.modeledDelegates = $scope.democrats[i].Clinton.expected;
			}
		}
		$scope.updateModel();
	}

	$scope.sandersBigWin = function(bigstates) {
		$scope.reset();
		var winPct = 0.75;
		var bigStateCriterion = 100;
		var testSize = function(delegates) {
			if (bigstates) {
				return delegates >= bigStateCriterion;
			} else {
				return delegates <= bigStateCriterion;
			}
		}
		for (i in $scope.democrats) {
			var primary = $scope.democrats[i];
			var totalDelegates = $scope.democrats[i].Sanders.expected + $scope.democrats[i].Clinton.expected;
			if (testSize(totalDelegates)) {
				$scope.democrats[i].Sanders.modeledDelegates = Math.round(totalDelegates * winPct);
				$scope.democrats[i].Clinton.modeledDelegates = totalDelegates - $scope.democrats[i].Sanders.modeledDelegates;
			}
		}
		$scope.updateModel()
	}

	$scope.sandersPctBetter = function(winScale) {
		$scope.reset();
		for (i in $scope.democrats) {
			if ($scope.democrats[i].notYetSet) {
				$scope.democrats[i].Sanders.modeledDelegates = Math.round($scope.democrats[i].Sanders.expected * winScale);
				$scope.democrats[i].Clinton.modeledDelegates =  $scope.democrats[i].Sanders.expected + 
																$scope.democrats[i].Clinton.expected - 
																$scope.democrats[i].Sanders.modeledDelegates;
			}
		}
		$scope.updateModel();
	}

	$scope.sumAllDemocraticDelegates = function() {
		$scope.totalDelegates.Sanders = 0;
		$scope.totalDelegates.Clinton = 0;
		if ($scope.superDelegatesEnabled) {
			$scope.totalDelegates.Clinton = $scope.democratsuperdelegates.Clinton;
			$scope.totalDelegates.Sanders = $scope.democratsuperdelegates.Sanders;
		}
		$scope.totalDelegates.Clinton_actual = 0;
		$scope.totalDelegates.Sanders_actual = 0;
		$scope.totalDelegates.Clinton_expected = $scope.totalDelegates.Sanders_expected = 0;
		for (i in $scope.democrats) {
			var state = $scope.democrats[i].state;
			$scope.totalDelegates.Clinton_expected += $scope.democrats[i].Clinton.expected;
			$scope.totalDelegates.Sanders_expected += $scope.democrats[i].Sanders.expected;			
			if ($scope.democrats[i].notYetSet) {
				$scope.totalDelegates.Sanders += $scope.democrats[i].Sanders.modeledDelegates;
				$scope.totalDelegates.Clinton += $scope.democrats[i].Clinton.modeledDelegates;
			} else {
				$scope.totalDelegates.Sanders_actual += $scope.democrats[i].Sanders.actual;
				$scope.totalDelegates.Clinton_actual += $scope.democrats[i].Clinton.actual;
				$scope.totalDelegates.Sanders += $scope.democrats[i].Sanders.actual;
				$scope.totalDelegates.Clinton += $scope.democrats[i].Clinton.actual;				
			}
		}
	};

	$scope.count = 0;
	$scope.sliderDidChange = function(senderState, party, modelSlider) {
		var partyData = $scope[party];
		for (primary in partyData) {
			var state = partyData[primary];
			if (state.state == senderState) {
				$scope.democrats[primary].Sanders.modeledDelegates = state.Sanders.modeledDelegates = parseFloat(modelSlider);
				$scope.democrats[primary].Clinton.modeledDelegates = state.Clinton.modeledDelegates = state.totalDelegates - state.Sanders.modeledDelegates;
				break;
			}
		}
		$scope.updateModel()
	};

});

var demCandidates = ["Clinton", "Sanders"];
var formatCandidates = function(d) {
    return demCandidates[d % 2];      
}

var formatDelegates = function(d) {
	return d ;
}

// from http://bl.ocks.org/biovisualize/5372077
d3.custom = {}
d3.custom.barChart = function module() {
    var margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = 500,	// TODO(iveygman): make these auto-scale?
        height = 1000 - margin.top - margin.bottom,
        gap = 0,
        ease = 'cubic-in-out';
    var svg;

   var dispatch = d3.dispatch('customHover');
    function exports(_selection) {
        _selection.each(function(_data) {

            var chartW = width - margin.left - margin.right,
                chartH = height - margin.top - margin.bottom;

            var x1 = d3.scale.ordinal()
                .domain(_data.map(function(d, i){ return i; }))
                .rangeRoundBands([0, chartW], .1);

            var y1 = d3.scale.linear()
                .domain([0, allDelegates.democrats]).nice()
                .range([chartH, 0]);

            var xAxis = d3.svg.axis()
                .scale(x1)
                .orient('bottom').tickFormat(formatCandidates);

            var yAxis = d3.svg.axis()
                .scale(y1)
                .orient('left').tickFormat(formatDelegates);

			var yline = d3.scale.linear().range([delegatesToWin.democrats, 0]);

            var barW = chartW / _data.length;

            if(!svg) {
                svg = d3.select(this)
                    .append('svg')
                    .classed('chart', true);
                var container = svg.append('g').classed('container-group', true);
                container.append('g').classed('chart-group', true);
                container.append('g').classed('x-axis-group axis', true);
                container.append('g').classed('y-axis-group axis', true);
            }

            svg.transition().duration(duration).attr({width: width, height: height})
            svg.select('.container-group')
                .attr({transform: 'translate(' + margin.left + ',' + margin.top + ')'});

            svg.select('.x-axis-group.axis')
                .transition()
                .duration(duration)
                .ease(ease)
                .attr({transform: 'translate(0,' + (chartH) + ')'})
                .call(xAxis);

            svg.select('.y-axis-group.axis')
                .transition()
                .duration(duration)
                .ease(ease)
                .attr({transform: 'translate('+margin.left+",0)"})
                .call(yAxis);

            var gapSize = x1.rangeBand() / 100 * gap;
            var barW = x1.rangeBand() - gapSize;
            var bars = svg.select('.chart-group')
                .selectAll('.bar')
                .data(_data);
            bars.enter().append('rect')
                .classed('bar', true)
                .attr(
            	{	
            		x: chartW,
                    width: barW,
                    y: function(d, i) {  return !isNaN(y1(d)) ? y1(d) : 0; },
                    height: function(d, i) {  return !isNaN(chartH - y1(d)) ? chartH - y1(d) : 0; }
                })
                .on('mouseover', dispatch.customHover);
            bars.transition()
                .duration(duration)
                .ease(ease)
                .attr({
                    width: barW,
                    x: function(d, i) { return x1(i) + gapSize/2; },
                    y: function(d, i) {  return !isNaN(y1(d)) ? y1(d) : 0; },
                    height: function(d, i) {  return !isNaN(chartH - y1(d)) ? chartH - y1(d) : 0; }
                }).style('fill', function(d, i) { 
                	if (d > delegatesToWin.democrats) {
                		return '#CCC02B';
                	} else {
                		return '#0000DD';
                	}
                });
            bars.exit().transition().style({opacity: 0}).remove();
            // bars.selectAll('rect').style('fill', '#FF00DD');


            if (drawCount < 2) {
            	drawCount += 1;
				svg.append("text")
		           .attr("text-anchor", "middle")  // this makes it easy to center the text as the transform is applied to the anchor
	               .attr("transform", "translate("+ margin.left/2 +","+ chartH/2+")rotate(-90)") // text is drawn off the screen top left, move down and out and rotate
	               .text("100's of delegates");
           	}

        });
    }
    exports.width = function(_x) {
        if (!arguments.length) return width;
        width = parseInt(_x);
        return this;
    };
    exports.height = function(_x) {
        if (!arguments.length) return height;
        height = parseInt(_x);
        duration = 0;
        return this;
    };
    exports.gap = function(_x) {
        if (!arguments.length) return gap;
        gap = _x;
        return this;
    };
    exports.ease = function(_x) {
        if (!arguments.length) return ease;
        ease = _x;
        return this;
    };
    d3.rebind(exports, dispatch, 'on');
    return exports;

};

delegateApp.directive('barChart', function(){
    var chart = d3.custom.barChart();
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="chart"></div>',
        scope:{
            height: '=height',
            data: '=data',
            hovered: '&hovered'
        },
        link: function(scope, element, attrs) {
            var chartEl = d3.select(element[0]);
            chart.on('customHover', function(d, i){
                scope.hovered({args:d});
            });

            scope.$watch('data', function (newVal, oldVal) {
                chartEl.datum(newVal).call(chart);
            });

            scope.$watch('height', function(d, i){
                chartEl.call(chart.height(scope.height));
            })
        }
    }
});
