var entities = [{
  "name": "foo"
}];

$(function() {
  visualize();
});

var visualize = function() {
  $("#elist").html("");
  $.each(entities, function(index, value) {
    $("#elist").append(
      $("<li>").attr("class", "entity").attr("id", value.name)
      .append($("<a>")
        .attr('href', '#')
        .append($("<span>")
          .append(value.name)
        )
      )
      .append(" ")
      .append($("<a>").attr('href', '#').attr('onclick', 'deleteentity("' + value.name + '")')
        .append("-"))
      .append(" ")
      .append($("<a>").attr('href', '#')
        .append($("<img>").attr("class", "icon addproperty")))
      .append(" ")
      .append($("<a>").attr('href', '#')
        .append($("<img>").attr("class", "icon addlink"))
      )
    );
    $("#" + value.name).draggable();
  })

}

var newentity = function() {
  var ename = prompt("New entity", "");
  if (ename) {
    var newentity = {};
    newentity.name = ename;
    entities.push(newentity);
    visualize();
  }
}

var deleteentity = function(d) {
  var yes = confirm("Delete " + d + "?");
  if (yes) {
    entities = $.grep(entities, function(value) {
      return value.name != d;
    });
    visualize();
  }
}