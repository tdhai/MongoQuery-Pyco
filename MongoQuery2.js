// Find a Mongo query to show the number of collections, objects, storageSize, indexes … of the imported database
db.getMongo().getDBNames().length
db.getCollectionNames().length
db.getCollectionInfos().reduce(function(total, current){
    return total + db.getCollection((current.name)).storageSize()
},0)

// How many products related to “Tofu” are there?
db.products.find({ProductName: "/.*Tofu.*/"})

//How many products that have less than 10 units in stock?
db.products.aggregate([
    {$match: {UnitsInStock: {$lt:10}}},
    {$count: "Procduc less than 10"}
    ])

//How many products belong to category “Confections” that have less than 10 units in stock?
db.categories.aggregate([
    {$match: {"CategoryName": "Confections"}},
    {
      $lookup:
         {
           from: "products",
           let: {category_id: "CategoryID", category_name: "CategoryName"},
           pipeline: [
              { $match:
                 { $expr:
                    { $and:
                       [
                         { $eq: [ "$CategoryID",  "$$category_id" ] },
                         {$lt:["$UnitsInStock",10]}
                       ]
                    }
                 }
              }
           ],
         }
    }
]).getAggregationPipeline().length

//In one query, return a list of categories and number of products per category with only category ID, 
//category name and the number of products
db.categories.aggregate([
    {$lookup: {
           from: "products",
           localField: "CategoryID",
           foreignField: "CategoryID",
           as: "products"}},
    {$project: {_id:0, CategoryID: 1, CategoryName:1, 
        numberOfProduct: 
        {
            $cond:
            {
                if:{$isArray: "$products"}, then:{$size: "$products"},else: "Fail"
            }
        }
    }
])

// Find the 2nd page of 10 products, sorted by product name
db.products.find().skip(10).limit(10)

// Find the top 5 customers (most spending) together with the products they bought on the system
db.getCollection("order-details").aggregate([
    {$group:{
        _id: "$OrderID", totalPrice: {$sum: {$multiply: ["$Quantity", "$UnitPrice"]}}, listProduct: {$addToSet: "$ProductID"}}
    },
    {$lookup: {
           from: "orders",
           localField: "_id",
           foreignField: "OrderID",
           as: "Order_doc"
         }
    },
    {$unwind: "$Order_doc"},
    {$group: { _id: "$Order_doc.CustomerID", amount: {$sum: '$totalPrice'}, listProduct: {$push: "$listProduct"}}},
    {$sort: {amount: -1}},
    {$limit: 5},
    {$project:{
        _id: 1, amount: 1, listProduct:{$reduce: {
              input: "$listProduct",
              initialValue: [],
              in: {$setUnion: ["$$value","$$this"]}  
        }
    }}}
])

// Find the top 5 categories (best buy) together with their top 5 products of the system 
db.categories.aggregate([
    {$lookup: {
        from: "products",
        let: { categoryID: "$CategoryID"},
        pipeline: [
            { $match:{ $expr:{ 
                $eq: ["$CategoryID","$$categoryID"]
            }}},
            {$sort: {"UnitsOnOrder": -1}}
        ],
        as: "product_doc"
    }},
    {$addFields: {amountOrder: {$sum: "$product_doc.UnitsOnOrder"}}},
    {$sort: {amountOrder: -1}},
    {$limit: 5},
    {$project: {categoryName: 1, amountOrder: 1, BestFiveProductOrder: {$slice: ["$product_doc",5]}}
])


// Explain the query to list all customers whose name started with “A”
db.customers.find({"CustomerID": /^A/})

// Add index to the column containing customers’ name 
// and explain the query again to confirm that it is faster now
//because Query database by index, index start min to max, when you find a item which select zone to find faster
db.customers.createIndex({"ContactName": 1})

// Update product collection to embed the category information inside each document

    
    