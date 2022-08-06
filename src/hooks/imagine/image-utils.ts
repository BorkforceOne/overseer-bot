import * as Jimp from 'jimp';

export enum Direction {
  VERTICAL,
  HORIZONTAL,
};

interface ImgData {
  img: Jimp;
  x: number;
  y: number;
}

export async function mergeImg(images: Buffer[], {
  direction = Direction.HORIZONTAL,
  color = 0x00000000,
  offset = 0,
  mime = Jimp.MIME_PNG,
}: {
  direction?: Direction,
  color?: number,
  offset?: number,
  mime?: string,
} = {}): Promise<Buffer> {
  const processImg = async (img: Buffer) => {
    return {
      img: await Jimp.read(img),
    };
  };

  return Promise.all(images.map(processImg))
    .then(async (imgs) => {
      let totalX = 0;
      let totalY = 0;

      const imgData = imgs.reduce((res, {img}) => {
        const {bitmap: {width, height}} = img;

        res.push({
          img,
          x: totalX,
          y: totalY,
        });

        totalX += width;
        totalY += height;

        return res;
      }, [] as ImgData[]);

      let totalWidth = Math.max(...imgData.map(({img: {bitmap: {width}}}) => width));
      let totalHeight = Math.max(...imgData.map(({img: {bitmap: {height}}}) => height));
      
      if (direction === Direction.HORIZONTAL) {
        totalWidth = imgData.map(({img: {bitmap: {width}}}) => width)
                            .reduce((acc, width) => {acc += width; return acc;}, 0);
        totalWidth += (imgData.length - 1) * offset;
      } else if (direction === Direction.VERTICAL) {
        totalHeight = imgData.map(({img: {bitmap: {height}}}) => height)
                            .reduce((acc, height) => {acc += height; return acc;}, 0);
        totalHeight += (imgData.length - 1) * offset;
      }

      const baseImage = new Jimp(totalWidth, totalHeight, color);

      for (const [index, {img, x, y}] of imgData.entries()) {
        let px = 0;
        let py = 0;
        
        if (direction === Direction.HORIZONTAL) {
          px += x + (index * offset);
        } else if (direction === Direction.VERTICAL) {
          py = y + (index * offset);
        }

        baseImage.composite(img, px, py);
      }

      return await baseImage.getBufferAsync(mime);
    });
}
