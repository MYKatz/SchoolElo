$(document).ready(function(){
    var matchHash = null
    $("#open").on("click", function(){
        $.getJSON("/api/newMatch", function(data){
            console.log(data.school1);
            $("#school1").html(data.school1);
            $("#school2").html(data.school2);
            matchHash = data.hash;
        });
    });
    $(".sub").on("click", function(){
        var result = parseFloat($(this).attr("val"))
        console.log({hash: matchHash, result: result});
        $.post("/api/matchResult", {hash: matchHash, result: result}, function(res){
            location.reload(true);
        });
    });
});
