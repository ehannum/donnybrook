$(function () {
  // Person object:
  // {
  //   name: "string",  (it's your name you dip!)
  //   hasCar: number,  (# of seats, 0 = no car)
  //   leaving: number, (Date.getTime() earliest able)
  //   keymaster: bool, (the person with the keys)
  //   group: number    (groups should stick together)
  // }

  var generateCarpools = function (people) {
    var keymaster = null;
    var cars = [];
    var emptySeats = 0;

    for (var i = 0; i < people.length; i++) {
      if (people[i].keymaster) {
        keymaster = people[i];
      }
      if (people[i].hasCar) {
        var car = {
          leaving: people[i].leaving,
          passengers: [],
          seats: people[i].hasCar
        };

        emptySeats += people[i].hasCar - car.passengers.length;

        if (people[i].group) {
          car.passengers = multiObjectMatch(people, {group: people[i].group}, false, true);
        } else {
          car.passengers[0] = people[i];
          people.splice(i, 1);
        }

        i--;
        cars.push(car);
      }
    }

    if (people.length > emptySeats) {
      console.warn('ERROR: NO SEATS!? There are just not enough seats for all the people.');
      return false;
    }

    cars.sort(function (a, b) {
      return a.leaving > b.leaving;
    });

    for (var j = 0; j < people.length; j++) {
      for (var k = 0; k < cars.length; k++) {
        if (people[j].group) {
          var group = people[j].group;
          var peopleInGroup = multiObjectMatch(people, {group: group});
          if (cars[k].passengers.length + peopleInGroup.length <= cars[k].seats) {
            cars[k].passengers = cars[k].passengers.concat(peopleInGroup);
            multiObjectMatch(people, {group: group}, false, true);
            j--;
            break;
          } else {
            continue; // not enough room in this car for the people in this group
          }
        } else if (people[j].leaving <= cars[k].leaving && cars[k].passengers.length < cars[k].seats) {
          cars[k].passengers.push(people[j]);
          people.splice(j, 1);
          j--;
          break;
        }
      }
    }

    if (people.length) {
      // todo: replace this with an auto balancing algorithm
      console.warn('These rides just arent going to work. Consider leaving later.');
      cars.push({leftovers: people});
    }

    return cars;
  };

  var multiObjectMatch = function (objects, properties, strict, destructive) {
    // Searches an array of (objects) and returns all objects with
    // key/value pairs that match those in the (properties) object.

    // If (strict) is true then ALL properties must match, if
    // false then only some must match.

    // If (destructive) is true then the matching objects will be
    // removed from the passed in array.

    var result = [];

    // strict and destructive are optional arguments
    if (strict === undefined) {
      strict = true;
    }
    if (destructive === undefined) {
      destructive = false;
    }

    for (var i = 0; i < objects.length; i++) {
      var passes = 0;
      for (var key in properties) {
        if (objects[i][key] && objects[i][key] === properties[key]) {
          if (strict) {
            passes++;

            if (passes === Object.keys(properties).length) {
              result.push(objects[i]);
              if (destructive) {
                objects.splice(i, 1);
                i--;
              }
            }
          } else {
            result.push(objects[i]);
            if (destructive) objects.splice(i, 1);
            i--;
            break;
          }
        }
      }
    }

    return result;
  };

  var multiObjectSearch = function (objects, keyName) {
    var results = [];

    for (var i = 0; i < objects.length; i++) {
      if (objects[i][keyName]) {
        results.push(objects[i][keyName]);
      }
    }

    return results;
  };
});
