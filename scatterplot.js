/**
 * Created by asus1 on 2015/8/14.
 */
var FILENAME = "scatterplot.json";
var SVGNS = "http://www.w3.org/2000/svg";
var MAX_INCOME = 100000, MIN_INCOME = 300;
var MAX_LIFE=85,MIN_LIFE=10;
var MAX_POPULATION = 1500000000,MIN_POPULATION=1;
var MAX_R = 60, MIN_R=1;
var height = 500,width = 1000;
var marginX = 50,marginY = 20;
var container = getContainer();
var minTime = parseInt(document.getElementById("min-time").innerHTML);
var maxTime = parseInt(document.getElementById("max-time").innerHTML);
var lastChoisenYear = 0;
var data = [];
var axisXPoint = [300,400,1000,2000,3000,4000,10000,20000,30000,40000,100000];
var colors = {
    "America":"rgb(255,0,0)",
    "Middle East & North Africa": "rgb(0,255,0)",
    "Europe & Central Asia":"rgb(0,0,255)",
    "South Asia":"rgb(128,128,0)",
    "East Asia & Pacific":"rgb(0,128,128)",
    "Sub-Saharan Africa":"rgb(128,0,128)"
};
$.ajaxSettings.async = false;
$.getJSON(FILENAME,function(d){
    data = d.data;
});
initialize(data);
drawAxis();
drawCircles(data,0);
start();


function getContainer(){
    return document.getElementById("chart");
}


function initialize(){
    for(var i =0;i<data.length;i++){
        data[i].income = interpolation(data[i].income);
        data[i].population = interpolation(data[i].population);
        data[i].lifeExpectancy = interpolation(data[i].lifeExpectancy);
    }
}

function start(){
    var rangeBar = document.getElementById("range");
    if(rangeBar.value!=lastChoisenYear){
        changeYear(parseInt(rangeBar.value));
        lastChoisenYear = rangeBar.value;
    }
    setTimeout("start()",40);
}

function changeYear(year){
    var yearText = document.getElementById("year");
    yearText.innerHTML = year+minTime;
    redrawCircles(data,year);
}

function interpolation(data){
    var i,j;
    var result = [];
    for(i=0;i<data.length;i++){
        var index = data[i][0];
        result[index-minTime] = data[i][1];
    }
    var tempValue = result[0];
    var tempYear = 0;
    for(i=0;i<=maxTime-minTime;i++){
        if(result[i]!=null){
            if(tempValue==null){
                for(j=tempYear;j<i;j++){
                    result[j] = result[i];
                }
            }else{
                var interval = (result[i]-tempValue)/(i-tempYear);
                for(j=tempYear;j<i;j++){
                    result[j] = tempValue+(j-tempYear)*interval;
                }
            }
            tempValue = result[i];
            tempYear = i;
        }
    }
    for(i=tempYear;i<=maxTime-minTime;i++){
        result[i] = tempValue;
    }
    return result;
}

function redrawCircles(data,year){
    var circles = document.getElementsByTagName("circle");
    for(var i=0;i<data.length;i++){
        setCircle(data[i],circles[i],year);
    }
}

function drawCircles(data,year){
    for(var i=0;i<data.length;i++){
        var circle = document.createElementNS(SVGNS,"circle");
        circle.bindData = data[i];
        data[i].isSelected = false;
        setCircle(data[i],circle,year);
        circle.addEventListener("click",click);
        circle.addEventListener("mouseover",mouseOver);
        circle.addEventListener("mouseout",mouseOut);
        container.appendChild(circle);
    }
}

function click(){
    if(this.bindData.isSelected==false){
        this.bindData.isSelected=true;
        drawPath(this.bindData);
        this.setAttribute("class","circleSelected");
    }else{
        this.bindData.isSelected=false;
        deletePath(this.bindData);
        this.setAttribute("class","circleUnelected");
    }
}

function mouseOver(){
    var circles = document.getElementsByTagName("circle");
    for(var i=0;i<circles.length;i++){
        if(circles[i].id!=this.id&&circles[i].bindData.isSelected==false){
            circles[i].setAttribute("opacity","0.3");
        }
    }
    var path = document.getElementById(this.bindData.name);
    if(path==null){
        drawPath(this.bindData);
    }
    var country = document.getElementById("country");
    country.innerHTML = this.bindData.name;
}

function mouseOut(){
    var circles = document.getElementsByTagName("circle");
    for(var i=0;i<circles.length;i++){
        circles[i].setAttribute("opacity","1");
    }
    if(this.bindData.isSelected==false){
        deletePath(this.bindData);
    }
    var country = document.getElementById("country");
    country.innerHTML = null;
}

function setCircle(data,circle,year){
    var population = data.population[year];
    var income = data.income[year];
    var lifeExpectancy = data.lifeExpectancy[year];
    var x = scaleX(income);
    var y = scaleY(lifeExpectancy);
    var r = scaleR(population);
    circle.setAttribute("cx",x);
    circle.setAttribute("cy",y);
    circle.setAttribute("r",r);
    circle.setAttribute("id","circle"+data.name);
    circle.setAttribute("fill",colors[data.region]);
    if(data.isSelected==false){
        circle.setAttribute("class","circleUnselected");
    }else{
        circle.setAttribute("class","circleSelected");
    }
}

function drawPath(data){
    var path = document.createElementNS(SVGNS,"path");
    var d = "M";
    for(var i=0;i<maxTime-minTime;i++){
        d+=scaleX(data.income[i])+","+scaleY(data.lifeExpectancy[i]);
        d+="L";
    }
    d+=scaleX(data.income[i])+","+scaleY(data.lifeExpectancy[i]);
    path.setAttribute("d",d);
    path.setAttribute("stroke","black");
    path.setAttribute("fill","none");
    path.setAttribute("opacity","0.5");
    path.setAttribute("id",data.name);
    container.appendChild(path);
}

function deletePath(data){
    var path = document.getElementById(data.name);
    path.parentNode.removeChild(path);
}

function scaleX(value){
    return marginX+(width-marginX)*((Math.log(value)-Math.log(MIN_INCOME))
    /(Math.log(MAX_INCOME)-Math.log(MIN_INCOME)));
}

function scaleY(value){
    return height -marginY- (height-marginY)*(value-MIN_LIFE)/(MAX_LIFE-MIN_LIFE);
}

function scaleR(value){
    return MIN_R+(MAX_R-MIN_R)*(Math.sqrt(value)-Math.sqrt(MIN_POPULATION))
    /(Math.sqrt(MAX_POPULATION)-Math.sqrt(MIN_POPULATION));
}

function drawAxis(){
    drawAxisX();
    drawAxisY();
}

function drawAxisX(){
    var axisX = document.createElementNS(SVGNS,"g");
    var line = document.createElementNS(SVGNS,"path");
    var startX = scaleX(MIN_INCOME), endX = scaleX(MAX_INCOME);
    var startY = scaleY(MIN_LIFE);
    line.setAttribute("d","M"+startX+","+startY
        +"L"+endX+","+startY);
    line.setAttribute("stroke","black");
    axisX.appendChild(line);
    for(var i=0;i<axisXPoint.length;i++){
        var text = document.createElementNS(SVGNS,"text");
        text.setAttribute("text-anchor","middle");
        text.setAttribute("x",scaleX(axisXPoint[i]));
        text.setAttribute("y",startY+20);
        text.setAttribute("font-size","10px");
        text.innerHTML = axisXPoint[i];
        axisX.appendChild(text);
    }
    i=MIN_INCOME;
    while(i<=MAX_INCOME){
        var point = document.createElementNS(SVGNS,"path");
        point.setAttribute("d","M"+scaleX(i)+","+startY
        +"V"+(startY+5));
        point.setAttribute("stroke","black");
        axisX.appendChild(point);
        if(i<1000){
            i+=100;
        }else if(i<10000){
            i+=1000;
        }else{
            i+=10000;
        }
    }
    container.appendChild(axisX);
}

function drawAxisY(){
    var axisY = document.createElementNS(SVGNS,"g");
    var line = document.createElementNS(SVGNS,"path");
    var startX = scaleX(MIN_INCOME);
    var startY = scaleY(MIN_LIFE), endY=scaleY(MAX_LIFE);
    line.setAttribute("d","M"+startX+","+startY
    +"L"+startX+","+endY);
    line.setAttribute("stroke","black");
    axisY.appendChild(line);
    var i = MIN_LIFE;
    while(i<=MAX_LIFE){
        var text = document.createElementNS(SVGNS,"text");
        text.setAttribute("text-anchor","middle");
        text.setAttribute("x",startX-10);
        text.setAttribute("y",scaleY(i));
        text.setAttribute("font-size","10px");
        text.innerHTML = i;
        axisY.appendChild(text);
        var point = document.createElementNS(SVGNS,"path");
        point.setAttribute("d","M"+startX+","+scaleY(i)
        +"H"+(startX-5));
        point.setAttribute("stroke","black");
        axisY.appendChild(point);
        i+=10;
    }
    container.appendChild(axisY);
}