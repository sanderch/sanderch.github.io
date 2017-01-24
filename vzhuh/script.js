// alert("asfd");

$(function() {


  $("#ml").change(function() {
    $('#json').prop("disabled", !this.checked);
    $('#json').prop("checked", this.checked && $('#json').prop("checked"));
    $('#vzhuh').css("display", !this.checked ? "" : "none").fadeOut(2000);
  });


});