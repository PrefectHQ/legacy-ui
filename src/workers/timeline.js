export function GenerateRows(items) {
  const grid = []
  const start = Date.now()
  const end = Date.now()
  const rowMap = {}

  itemLoop: for (let i = 0; i < items.length; ++i) {
    const item = items[i]

    // If the item hasn't started yet, we distribute
    // it to the row with the least items already
    if (!item.start_time) {
      const lengths = grid.map(row => row.length)
      let row = lengths.indexOf(Math.min(...lengths))

      rowMap[item.id] = row

      if (!grid[row]) {
        grid.push([[start, end]])
      } else {
        grid[row].push([start, end])
      }

      continue itemLoop
    }

    const start_ = item.start_time ? new Date(item.start_time).getTime() : null
    const end_ = item.end_time ? new Date(item.end_time).getTime() : Date.now()

    for (let row = 0; row <= grid.length; ++row) {
      // If the current row doesn't exist, create it, put this item on it,
      // and move to the next item
      if (!grid[row]) {
        rowMap[item.id] = row
        grid.push([[start_, end_]])
        continue itemLoop
      }

      if (!start_) {
        const lengths = grid.map(row => row.length)
        let row = lengths.indexOf(Math.min(...lengths))

        rowMap[item.id] = row
        grid[row].push([start_, end_])
        continue itemLoop
      }

      // Otherwise check the start and end times against each
      // start[0] and end[1] time in the row
      let intersects = grid[row].some(
        slot => end_ <= slot[0] - 2000 || start_ <= slot[1] + 2000
      )

      // let intersects = grid[row].some(
      //   slot => end <= slot[0] || start <= slot[1]
      // )

      if (!intersects) {
        rowMap[item.id] = row
        grid[row].push([start_, end_])
        continue itemLoop
      }
    }
  }

  return { rowMap, rows: grid.length }
}
